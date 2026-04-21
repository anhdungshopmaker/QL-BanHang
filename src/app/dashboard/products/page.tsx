'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Plus, Search, MoreVertical, Edit2, Trash2, ImageIcon, Loader2, QrCode as QrIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProductManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();

    const newProduct = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      shop_id: profile?.shop_id,
    };

    const { error } = await supabase.from('products').insert(newProduct);
    if (!error) {
      setShowAddModal(false);
      fetchProducts();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Sản phẩm</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Danh mục & Đơn giá</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-slate-900 text-white font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          THÊM SẢN PHẨM
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input type="text" placeholder="Tìm kiếm tên sản phẩm..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-indigo-500" />
        </div>
        <select className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest outline-none w-full md:w-auto">
          <option>Tất cả danh mục</option>
          <option>Đồ ăn</option>
          <option>Đồ uống</option>
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-pulse h-48"></div>
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
             <Package size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chưa có sản phẩm nào</p>
          </div>
        ) : products.map((product) => (
          <div key={product.id} className="bg-white group rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden relative">
            <div className="h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden">
               {product.image_url ? (
                 <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
               ) : (
                 <ImageIcon size={32} className="text-slate-200" />
               )}
               <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-900 rounded-xl shadow-lg border border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-default">
                    <QRCodeSVG value={product.id} size={50} />
                  </div>
               </div>
               <div className="absolute top-4 right-4 flex gap-2 translate-y-10 group-hover:translate-y-0 transition-all">
                  <button className="p-2 bg-white text-slate-600 rounded-xl shadow-lg border border-slate-100"><Edit2 size={14}/></button>
                  <button className="p-2 bg-rose-50 text-rose-500 rounded-xl shadow-lg border border-rose-100"><Trash2 size={14}/></button>
               </div>
            </div>
            <div className="p-6">
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{product.category || 'CHƯA PHÂN LOẠI'}</p>
               <h3 className="text-sm font-black text-slate-800 line-clamp-1">{product.name}</h3>
               <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                  <p className="text-lg font-black text-slate-900">{Intl.NumberFormat('vi-VN').format(product.price)}đ</p>
                  <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300">
                    <MoreVertical size={14} />
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -rotate-12"><Plus size={150}/></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Thêm Sản Phẩm Mới</h2>
                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm</label>
                    <input name="name" type="text" placeholder="VD: Bạc xỉu đá" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500 " />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán (VNĐ)</label>
                      <input name="price" type="number" placeholder="25000" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh mục</label>
                      <select name="category" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500 appearance-none">
                        <option value="Đồ ăn">Đồ ăn</option>
                        <option value="Đồ uống">Đồ uống</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Hủy bỏ</button>
                    <button disabled={saving} type="submit" className="flex-[2] bg-indigo-600 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                      {saving ? <Loader2 size={18} className="animate-spin" /> : 'LƯU SẢN PHẨM'}
                    </button>
                  </div>
                </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
