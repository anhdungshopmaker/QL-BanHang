'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Store, Lock, Unlock, Hash, Calendar, Loader2, Search, ExternalLink } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  const fetchShops = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // Verify if user is super_admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    
    if (profile?.role !== 'super_admin') {
       alert('Bạn không có quyền truy cập trang này!');
       window.location.href = '/dashboard';
       return;
    }

    const { data } = await supabase.from('shops').select('*, profiles(count)').order('created_at', { ascending: false });
    setShops(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, []);

  const toggleShopLock = async (shopId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    const { error } = await supabase.from('shops').update({ status: newStatus }).eq('id', shopId);
    if (!error) fetchShops();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
               <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hệ Thống Phân Phối (SaaS)</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Quản lý mạng lưới Shop & Gói dịch vụ</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tổng số Shop</p>
            <h2 className="text-4xl font-black text-slate-900 leading-none">{shops.length}</h2>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shop đang hoạt động</p>
            <h2 className="text-4xl font-black text-emerald-500 leading-none">{shops.filter(s => s.status === 'active').length}</h2>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shop đã khóa</p>
            <h2 className="text-4xl font-black text-rose-500 leading-none">{shops.filter(s => s.status === 'locked').length}</h2>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Danh sách Cửa hàng</h3>
            <div className="relative w-64">
               <Search className="absolute left-4 top-2.5 text-slate-400" size={16} />
               <input type="text" placeholder="Tìm mã shop..." className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none" />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="p-6">Mã Shop</th>
                     <th className="p-6">Tên Cửa hàng</th>
                     <th className="p-6">Ngày tham gia</th>
                     <th className="p-6">Trạng thái</th>
                     <th className="p-6 text-right">Hành động</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                     <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200"/></td></tr>
                  ) : shops.map(shop => (
                     <tr key={shop.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-6 font-black text-indigo-600 text-sm">
                           <span className="flex items-center gap-1"><Hash size={14}/> {shop.code}</span>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Store size={18} className="text-slate-400"/></div>
                              <p className="text-sm font-black text-slate-800">{shop.name}</p>
                           </div>
                        </td>
                        <td className="p-6 text-xs text-slate-400 font-bold flex items-center gap-2">
                           <Calendar size={14}/> {new Date(shop.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-6">
                           <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${shop.status === 'active' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                              {shop.status === 'active' ? 'Đang chạy' : 'Đã khóa'}
                           </span>
                        </td>
                        <td className="p-6 text-right space-x-2">
                           <button 
                            onClick={() => toggleShopLock(shop.id, shop.status)}
                            className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-95 ${shop.status === 'active' ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                           >
                              {shop.status === 'active' ? <Lock size={18}/> : <Unlock size={18}/>}
                           </button>
                           <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                              <ExternalLink size={18}/>
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
