'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Loader2, ReceiptText, QrCode, Package, Tag, PlusCircle } from 'lucide-react';
import QRScanner from '@/components/QRScanner';

export default function POSInterface() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [orderDiscount, setOrderDiscount] = useState(0); // Giá trị giảm giá toàn đơn
  const [orderDiscountType, setOrderDiscountType] = useState<'amount' | 'percent'>('amount'); 
  const [manualItem, setManualItem] = useState({ name: '', price: 0 }); // Món ngoài menu
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  // NÂNG CẤP CA LÀM VIỆC & PHƯƠNG THỨC THANH TOÁN
  const [activeShift, setActiveShift] = useState<any>(null);
  const [registers, setRegisters] = useState<any[]>([]);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [startingCash, setStartingCash] = useState(0);
  const [selectedRegister, setSelectedRegister] = useState<string>('');
  const [orderType, setOrderType] = useState<'takeaway' | 'dine_in' | 'delivery'>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');

  // NÂNG CẤP SƠ ĐỒ BÀN (TABLE MAP)
  const [areas, setAreas] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeTableSessions, setActiveTableSessions] = useState<any[]>([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null); // Phiên bàn đang chọn


  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // LOAD SẢN PHẨM THEO SHOP_ID (FIX DATA LEAK)
  useEffect(() => {
    const fetchProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();
      
      if (profile?.shop_id) {
        // 1. Load Products
        const { data: pData } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('shop_id', profile.shop_id);
        setProducts(pData || []);

        // 2. Load Registers
        const { data: rData } = await supabase
          .from('pos_registers')
          .select('*')
          .eq('is_active', true)
          .eq('shop_id', profile.shop_id);
        setRegisters(rData || []);

        // 3. Load Active Shift (for this user/shop)
        const { data: sData } = await supabase
          .from('pos_shifts')
          .select('*, pos_registers(name)')
          .eq('status', 'open')
          .eq('shop_id', profile.shop_id)
          .maybeSingle(); // maybeSingle instead of single to avoid error if none
        setActiveShift(sData);

        // 4. Load Khu vực và Bàn
        const { data: areaData } = await supabase.from('areas').select('*').eq('is_active', true).eq('shop_id', profile.shop_id).order('sort_order');
        setAreas(areaData || []);
        
        const { data: tableData } = await supabase.from('tables').select('*').eq('is_active', true).eq('shop_id', profile.shop_id);
        setTables(tableData || []);

        // 5. Load Phiên bàn đang hoạt động
        const { data: sessionData } = await supabase.from('table_sessions').select('*').eq('status', 'active').eq('shop_id', profile.shop_id);
        setActiveTableSessions(sessionData || []);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // MỞ CA LÀM VIỆC MỚI
  const handleOpenShift = async () => {
    if (!selectedRegister) return showToast('Vui lòng chọn quầy', 'error');
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();

    if (!profile?.shop_id) return showToast('Lỗi: Không tìm thấy thông tin cửa hàng', 'error');

    const { data, error } = await supabase.from('pos_shifts').insert({
      shop_id: profile.shop_id,
      register_id: selectedRegister,
      opened_by: user?.id,
      starting_cash: startingCash,
      status: 'open'
    }).select('*, pos_registers(name)').single();

    if (error) {
      showToast(error.message, 'error');
    } else {
      setActiveShift(data);
      setShowOpenShiftModal(false);
      showToast('Đã mở ca thành công');
    }
    setLoading(false);
  };

  // MỞ PHIÊN BÀN MỚI
  const handleOpenTableSession = async (tableId: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();

    const existingSession = activeTableSessions.find(s => s.table_id === tableId);
    if (existingSession) {
       setSelectedSession(existingSession);
       setShowTableModal(false);
       setLoading(false);
       return;
    }

    const { data, error } = await supabase.from('table_sessions').insert({
      shop_id: profile?.shop_id,
      table_id: tableId,
      created_by: user?.id,
      status: 'active'
    }).select().single();

    if (error) {
      showToast(error.message, 'error');
    } else {
      setActiveTableSessions([...activeTableSessions, data]);
      setSelectedSession(data);
      setShowTableModal(false);
      showToast('Đã mở bàn thành công');
    }
    setLoading(false);
  };

  // THÊM VÀO GIỎ HÀNG (CÓ FIELD GIẢM GIÁ TỪNG MÓN)
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0, discountType: 'amount' }]); // Mặc định giảm giá = 0
    }
  };

  // THÊM MÓN THỦ CÔNG (OFF-MENU)
  const addManualItem = () => {
    if (!manualItem.name || manualItem.price <= 0) {
      showToast('Vui lòng nhập tên và giá món thủ công', 'error');
      return;
    }
    const newItem = {
      id: `manual-${Date.now()}`,
      name: `[NGOÀI] ${manualItem.name}`,
      price: manualItem.price,
      quantity: 1,
      discount: 0,
      discountType: 'amount',
      is_manual: true
    };
    setCart([...cart, newItem]);
    setManualItem({ name: '', price: 0 });
    showToast('Đã thêm món ngoài menu');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const updateItemDiscount = (id: string, discountValue: number, type: 'amount' | 'percent' = 'amount') => {
    setCart(cart.map(item => item.id === id ? { ...item, discount: Math.max(0, discountValue), discountType: type } : item));
  };

  const removeItem = (id: string) => setCart(cart.filter(item => item.id !== id));

  // TÍNH TOÁN TỔNG TIỀN (CÓ GIẢM GIÁ THEO % HOẶC TIỀN MẶT)
  const calculateTotal = () => {
    const itemsTotal = cart.reduce((sum, item) => {
      let discountAmount = 0;
      if (item.discountType === 'percent') {
        discountAmount = (item.price * (item.discount || 0)) / 100;
      } else {
        discountAmount = item.discount || 0;
      }
      const priceAfterDiscount = item.price - discountAmount;
      return sum + (priceAfterDiscount * item.quantity);
    }, 0);

    let finalOrderDiscount = 0;
    if (orderDiscountType === 'percent') {
      finalOrderDiscount = (itemsTotal * orderDiscount) / 100;
    } else {
      finalOrderDiscount = orderDiscount;
    }

    return Math.max(0, itemsTotal - finalOrderDiscount);
  };

  // XỬ LÝ THANH TOÁN (SERVER ACTION VERSION)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    
    try {
      const { processCheckoutAction } = await import('@/app/actions/pos');
      
      const result = await processCheckoutAction({
        cart,
        orderDiscount,
        orderDiscountType,
        finalTotal: calculateTotal(),
        shift_id: activeShift?.id,
        register_id: activeShift?.register_id,
        payment_method: paymentMethod,
        order_type: orderType,
        session_id: selectedSession?.id,
        table_id: selectedSession?.table_id
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      showToast('Thanh toán thành công!');
      setCart([]);
      setOrderDiscount(0);
      setOrderDiscountType('amount');
    } catch (err: any) {
      showToast(err.message || 'Lỗi thanh toán', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleScan = (decodedText: string) => {
    const product = products.find(p => p.id === decodedText);
    if (product) {
      addToCart(product);
      setShowScanner(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-[calc(100vh-140px)] flex gap-8 relative" style={{ fontFamily: 'Arial, sans-serif' }}>
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
      
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         {/* HEADER & SEARCH */}
         <div className="p-6 border-b border-slate-50 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Thực đơn</h2>
                 <button onClick={() => setShowScanner(true)} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                   <QrCode size={16} /> QUÉT MÃ
                 </button>
                 
                 {/* ORDER TYPE SELECTOR */}
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setOrderType('takeaway')}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${orderType === 'takeaway' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      Mang đi
                    </button>
                    <button 
                      onClick={() => { setOrderType('dine_in'); setShowTableModal(true); }}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${orderType === 'dine_in' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      Tại bàn
                    </button>
                 </div>
                 {orderType === 'dine_in' && (
                    <button onClick={() => setShowTableModal(true)} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all">
                      {selectedSession ? `Bàn: ${tables.find(t => t.id === selectedSession.table_id)?.name || '...'}` : 'CHỌN BÀN'}
                    </button>
                 )}
               </div>
              <div className="relative w-64">
                <Search className="absolute left-4 top-2.5 text-slate-400" size={16} />
                <input type="text" placeholder="Tìm món..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none" />
              </div>
            </div>

            {/* NHẬP MÓN THỦ CÔNG (OFF-MENU) */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <div className="flex-1 flex gap-2">
                  <input type="text" placeholder="Tên món ngoài menu..." value={manualItem.name} 
                    onChange={e => setManualItem({...manualItem, name: e.target.value})}
                    className="flex-[2] bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none" />
                  <input type="number" placeholder="Giá" value={manualItem.price || ''}
                    onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})}
                    className="flex-1 bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none" />
               </div>
               <button onClick={addManualItem} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100">
                 <PlusCircle size={20} />
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-200" /></div> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <button key={product.id} onClick={() => addToCart(product)}
                    className="flex flex-col items-start p-4 bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-3xl transition-all group">
                    <div className="w-full aspect-square bg-white rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                       {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-200" />}
                    </div>
                    <h3 className="text-xs font-black text-slate-800 text-left line-clamp-1">{product.name}</h3>
                    <p className="text-sm font-black text-slate-900 mt-2">{Intl.NumberFormat('vi-VN').format(product.price)}đ</p>
                  </button>
                ))}
              </div>
            )}
         </div>
      </div>

      <div className="w-96 flex flex-col gap-6">
         <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <ShoppingCart size={20} className="text-slate-400" />
                 <h2 className="text-lg font-black text-slate-900 italic">Giỏ hàng</h2>
               </div>
               <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{cart.length} món</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
               {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <ReceiptText size={48} className="mb-4 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest">Giỏ hàng đang trống</p>
                 </div>
               ) : (
                 cart.map(item => (
                   <div key={item.id} className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                           <h4 className="text-xs font-black text-slate-800 truncate">{item.name}</h4>
                           <p className="text-xs font-bold text-indigo-600">{Intl.NumberFormat('vi-VN').format(item.price)}đ</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                           <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400"><Minus size={14}/></button>
                           <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400"><Plus size={14}/></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                      </div>
                      {/* GIẢM GIÁ TRÊN TỪNG MÓN */}
                      <div className="flex items-center gap-2 mt-1 pt-2 border-t border-slate-100/50">
                         <Tag size={12} className="text-rose-500" />
                         <span className="text-[9px] font-black text-slate-400 uppercase">Giảm:</span>
                         <div className="flex-1 flex bg-white border border-slate-100 rounded overflow-hidden">
                            <input type="number" value={item.discount || ''} 
                              onChange={e => updateItemDiscount(item.id, Number(e.target.value), item.discountType)}
                              placeholder={item.discountType === 'percent' ? "%" : "đ"} 
                              className="w-full px-2 py-0.5 text-[10px] font-bold outline-none focus:bg-rose-50" />
                            <button 
                              onClick={() => updateItemDiscount(item.id, item.discount, item.discountType === 'amount' ? 'percent' : 'amount')}
                              className={`px-2 text-[9px] font-black transition-colors ${item.discountType === 'percent' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {item.discountType === 'percent' ? '%' : 'đ'}
                            </button>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-b-[2.5rem]">
               {/* GIẢM GIÁ TOÀN ĐƠN */}
               <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-rose-400" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Giảm toàn đơn</p>
                  </div>
                  <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    <input type="number" value={orderDiscount || ''} onChange={e => setOrderDiscount(Number(e.target.value))}
                      placeholder={orderDiscountType === 'percent' ? "%" : "đ"}
                      className="w-20 px-3 py-1.5 text-xs font-black text-rose-400 outline-none focus:bg-white/10 bg-transparent" />
                    <button 
                      onClick={() => setOrderDiscountType(orderDiscountType === 'amount' ? 'percent' : 'amount')}
                      className={`px-3 text-[10px] font-black transition-colors ${orderDiscountType === 'percent' ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                      {orderDiscountType === 'percent' ? '%' : 'đ'}
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between mb-2 opacity-60">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Tạm tính</p>
                  <p className="text-xs font-black">
                    {Intl.NumberFormat('vi-VN').format(
                      cart.reduce((sum, item) => {
                        let itemDiscount = item.discountType === 'percent' ? (item.price * item.discount / 100) : item.discount;
                        return sum + (item.price - itemDiscount) * item.quantity;
                      }, 0)
                    )}đ
                  </p>
               </div>
               <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng cộng</p>
                  <p className="text-2xl font-black text-indigo-400 italic leading-none">{Intl.NumberFormat('vi-VN').format(calculateTotal())}đ</p>
               </div>

               {/* PAYMENT METHOD SELECTOR */}
               <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => setPaymentMethod('cash')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'cash' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    Tiền mặt
                  </button>
                  <button onClick={() => setPaymentMethod('transfer')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'transfer' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    Chuyển khoản
                  </button>
               </div>

               <button disabled={cart.length === 0 || checkingOut} onClick={handleCheckout}
                className="w-full bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                  {checkingOut ? <Loader2 className="animate-spin" size={20} /> : (
                    <> <CreditCard size={20} /> THANH TOÁN NGAY </>
                  )}
               </button>
            </div>
         </div>
      </div>


      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* SHIFT OVERLAY - BẮT BUỘC MỞ CA */}
      {!loading && !activeShift && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <Package size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Ca làm việc đã đóng</h2>
            <p className="text-sm font-medium text-slate-500 mb-8">Bạn cần mở ca để bắt đầu ghi nhận doanh thu và thực hiện đơn hàng.</p>
            
            <button 
              onClick={() => setShowOpenShiftModal(true)}
              className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95">
              MỞ CA NGAY
            </button>
          </div>
        </div>
      )}

      {/* MODAL MỞ CA */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Mở Ca Làm Việc</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn Quầy Thu Ngân</label>
                <select 
                  value={selectedRegister} 
                  onChange={e => setSelectedRegister(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-indigo-500 appearance-none">
                  <option value="">-- Chọn máy POS --</option>
                  {registers.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền lẻ đầu ca (VNĐ)</label>
                <input 
                  type="number" 
                  value={startingCash || ''} 
                  onChange={e => setStartingCash(Number(e.target.value))}
                  placeholder="VD: 500000"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-indigo-500" />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowOpenShiftModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Hủy</button>
                <button 
                  onClick={handleOpenShift}
                  disabled={loading || !selectedRegister}
                  className="flex-[2] bg-indigo-600 hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'XÁC NHẬN MỞ CA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SƠ ĐỒ BÀN (TABLE MAP) */}
      {showTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex flex-col p-8">
          <div className="bg-white flex-1 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
               <div>
                 <h2 className="text-2xl font-black tracking-tight">Sơ đồ Bàn</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Chọn bàn để mở phiên phục vụ</p>
               </div>
               <button onClick={() => setShowTableModal(false)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-black transition-all">ĐÓNG</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
               {areas.map(area => {
                 const areaTables = tables.filter(t => t.area_id === area.id);
                 if (areaTables.length === 0) return null;
                 
                 return (
                   <div key={area.id} className="mb-12">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-4">
                        {area.name} <div className="h-px bg-slate-200 flex-1"></div>
                     </h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {areaTables.map(table => {
                           const activeSession = activeTableSessions.find(s => s.table_id === table.id);
                           const isOccupied = !!activeSession;
                           const isSelected = selectedSession?.table_id === table.id;

                           return (
                             <button 
                               key={table.id}
                               onClick={() => handleOpenTableSession(table.id)}
                               className={`relative aspect-square rounded-[2rem] p-4 flex flex-col items-center justify-center transition-all border-2 shadow-sm hover:shadow-xl active:scale-95 ${
                                 isSelected ? 'border-indigo-600 bg-indigo-50 shadow-indigo-100' :
                                 isOccupied ? 'border-rose-100 bg-rose-50' : 
                                 'border-white bg-white hover:border-indigo-100'
                               }`}>
                               
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                                 isSelected ? 'bg-indigo-600 text-white' :
                                 isOccupied ? 'bg-rose-500 text-white' : 
                                 'bg-slate-100 text-slate-400'
                               }`}>
                                 {isSelected ? <CreditCard size={20} /> : isOccupied ? <ReceiptText size={20} /> : <Plus size={20} />}
                               </div>

                               <h4 className={`text-sm font-black line-clamp-1 ${isOccupied && !isSelected ? 'text-rose-900' : 'text-slate-800'}`}>{table.name}</h4>
                               
                               <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                  isOccupied ? 'bg-rose-500' : 'bg-emerald-400'
                               }`}></div>

                               {isOccupied && (
                                 <p className="text-[9px] font-black uppercase text-rose-500 mt-2 bg-white px-2 py-0.5 rounded-full shadow-sm">Đang khách</p>
                               )}
                             </button>
                           );
                        })}
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

