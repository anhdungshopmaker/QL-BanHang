'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, Plus, Minus, CheckCircle, Loader2, Store, UtensilsCrossed } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function QRMenuMobile() {
  const { shopCode, tableId } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [table, setTable] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Shop
      const { data: shopData } = await supabase.from('shops').select('*').eq('code', shopCode).single();
      if (!shopData) return;
      setShop(shopData);

      // 2. Get Table
      const { data: tableData } = await supabase.from('tables').select('*').eq('id', tableId).single();
      setTable(tableData);

      // 3. Get Products
      const { data: prodData } = await supabase.from('products').select('*').eq('shop_id', shopData.id).eq('is_active', true);
      setProducts(prodData || []);
      setLoading(false);
    };
    fetchData();
  }, [shopCode, tableId]);

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
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      // Create order
      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        shop_id: shop.id,
        table_id: table.id,
        total_amount: total,
        status: 'pending',
        order_source: 'qr_menu'
      }).select().single();

      if (orderErr) throw orderErr;

      // Create items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      await supabase.from('order_items').insert(orderItems);

      // Notify realtime (via Supabase Broadcast or simply the dashboard will listen to 'orders' table inserts)
      setOrdered(true);
      setCart([]);
    } catch (e) {
      alert('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (ordered) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white animate-in zoom-in-95 duration-500">
       <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-100">
          <CheckCircle size={48} />
       </div>
       <h1 className="text-3xl font-black text-slate-900 tracking-tight">NHẬN ĐƠN THÀNH CÔNG!</h1>
       <p className="text-slate-500 font-bold mt-4 leading-relaxed">Đơn hàng của bạn đã được gửi tới quầy.<br />Vui lòng đợi giây lát, nhân viên sẽ phục vụ ngay.</p>
       <button onClick={() => setOrdered(false)} className="mt-12 bg-slate-900 text-white font-black px-10 py-5 rounded-3xl shadow-2xl">ĐẶT THÊM MÓN</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
       {/* Header */}
       <header className="bg-white p-6 sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Store size={20}/></div>
             <div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">{shop?.name}</h1>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{table?.table_number}</p>
             </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-indigo-600 uppercase">Menu Online</span>
          </div>
       </header>

       {/* Hero/Visual */}
       <div className="p-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
             <div className="absolute -right-10 -top-10 opacity-10 rotate-12"><UtensilsCrossed size={150} /></div>
             <h2 className="text-3xl font-black tracking-tighter italic leading-none">THỰC ĐƠN<br />HÔM NAY</h2>
             <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mt-4">Chào mừng quý khách!</p>
          </div>
       </div>

       {/* Product List */}
       <div className="px-6 space-y-4 mt-4">
          {products.map(product => {
            const inCart = cart.find(item => item.id === product.id);
            return (
              <div key={product.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all">
                 <div className="w-20 h-20 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <div className="text-slate-200 font-bold italic text-xs">NO IMG</div>}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-800 line-clamp-1">{product.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{product.category}</p>
                    <p className="text-sm font-black text-indigo-600 mt-2">{Intl.NumberFormat('vi-VN').format(product.price)}đ</p>
                 </div>
                 
                 {inCart ? (
                    <div className="flex items-center justify-between border-2 border-indigo-100 rounded-2xl p-1 gap-4">
                       <button onClick={() => updateQuantity(product.id, -1)} className="p-1.5 text-indigo-600"><Minus size={16}/></button>
                       <span className="text-xs font-black">{inCart.quantity}</span>
                       <button onClick={() => updateQuantity(product.id, 1)} className="p-1.5 text-indigo-600"><Plus size={16}/></button>
                    </div>
                 ) : (
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={20} />
                    </button>
                 )}
              </div>
            );
          })}
       </div>

       {/* Sticky Cart Footer */}
       {cart.length > 0 && (
         <div className="fixed bottom-0 left-0 right-0 p-6 z-50 animate-in slide-in-from-bottom-full duration-500">
            <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl flex items-center justify-between gap-6 ring-8 ring-slate-50">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cart.length} món đã chọn</p>
                  <p className="text-xl font-black text-white italic">{Intl.NumberFormat('vi-VN').format(total)}đ</p>
               </div>
               <button 
                onClick={handlePlaceOrder}
                disabled={ordering}
                className="flex-1 bg-indigo-600 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-xs tracking-widest"
               >
                  {ordering ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      GỬI ĐƠN <ShoppingBag size={18} />
                    </>
                  )}
               </button>
            </div>
         </div>
       )}
    </div>
  );
}
