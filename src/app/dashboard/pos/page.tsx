'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Send, Loader2, ReceiptText, User, QrCode, Package } from 'lucide-react';
import QRScanner from '@/components/QRScanner';

export default function POSInterface() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').eq('is_active', true);
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();
      
      const total = calculateTotal();
      
      // 1. Create order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ 
            shop_id: profile?.shop_id, 
            profile_id: user?.id,
            total_amount: total,
            status: 'completed'
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      await supabase.from('order_items').insert(orderItems);

      // 3. Success
      showToast('Thanh toán thành công! Đã ghi nhận đơn hàng.');
      setCart([]);
    } catch (err) {
      console.error(err);
      showToast('Lỗi thanh toán, vui lòng thử lại!', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleScan = (decodedText: string) => {
    const product = products.find(p => p.id === decodedText);
    if (product) {
      addToCart(product);
      setShowScanner(false);
      // Optional: Add a success toast here
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-[calc(100vh-140px)] flex gap-8 animate-in fade-in slide-in-from-right-4 duration-500 relative" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Thực đơn</h2>
              <button 
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
              >
                <QrCode size={16} />
                QUÉT MÃ
              </button>
            </div>
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-4 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm món nhanh..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-100" 
              />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-200" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-start p-4 bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-3xl transition-all group"
                  >
                    <div className="w-full aspect-square bg-white rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                       {product.image_url ? (
                         <img src={product.image_url} className="w-full h-full object-cover" />
                       ) : (
                         <Package size={24} className="text-slate-200 group-hover:text-indigo-200" />
                       )}
                    </div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">{product.category}</p>
                    <h3 className="text-xs font-black text-slate-800 text-left line-clamp-1">{product.name}</h3>
                    <p className="text-sm font-black text-slate-900 mt-2">{Intl.NumberFormat('vi-VN').format(product.price)}đ</p>
                  </button>
                ))}
              </div>
            )}
         </div>
      </div>

      {/* Right: Cart & Checkout */}
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
                   <div key={item.id} className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 group">
                      <div className="w-12 h-12 bg-white rounded-xl flex-shrink-0 flex items-center justify-center font-black text-[10px] text-slate-400">IMG</div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-xs font-black text-slate-800 truncate">{item.name}</h4>
                         <p className="text-xs font-bold text-indigo-600">{Intl.NumberFormat('vi-VN').format(item.price)}đ</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                         <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-rose-500"><Minus size={14}/></button>
                         <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                   </div>
                 ))
               )}
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-b-[2.5rem]">
               <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tạm tính</p>
                  <p className="text-sm font-black">{Intl.NumberFormat('vi-VN').format(calculateTotal())}đ</p>
               </div>
               <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng cộng</p>
                  <p className="text-2xl font-black text-indigo-400 italic leading-none">{Intl.NumberFormat('vi-VN').format(calculateTotal())}đ</p>
               </div>

               <button 
                disabled={cart.length === 0 || checkingOut}
                onClick={handleCheckout}
                className="w-full bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-900 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
               >
                  {checkingOut ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <CreditCard size={20} />
                      THANH TOÁN NGAY
                    </>
                  )}
               </button>
            </div>
         </div>
      </div>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}

