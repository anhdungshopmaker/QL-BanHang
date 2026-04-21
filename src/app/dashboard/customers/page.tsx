'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Plus, Search, Phone, Star, History, Loader2, Edit2 } from 'lucide-react';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();

    const newCustomer = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      shop_id: profile?.shop_id,
      points: 0
    };

    const { error } = await supabase.from('customers').insert(newCustomer);
    if (!error) {
       setShowAddModal(false);
       fetchCustomers();
    } else {
       alert('Số điện thoại đã tồn tại trong hệ thống shop!');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Khách hàng (CRM)</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tích điểm & Lịch sử mua hàng</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-slate-900 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          THÊM KHÁCH HÀNG
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
         <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-4 top-3 text-slate-400" size={16} />
               <input type="text" placeholder="Tìm tên hoặc số điện thoại..." className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-100" />
            </div>
         </div>

         <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-slate-50 rounded-3xl animate-pulse"></div>)
            ) : customers.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                 <Users size={48} className="mx-auto text-slate-100 mb-4" />
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chưa có khách hàng nào</p>
              </div>
            ) : customers.map(customer => (
              <div key={customer.id} className="bg-slate-50 p-6 rounded-[2rem] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -rotate-12"><Star size={100} fill="currentColor"/></div>
                 
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{customer.name[0]}</div>
                    <div>
                       <h3 className="text-sm font-black text-slate-900 leading-none">{customer.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1"><Phone size={10}/> {customer.phone}</p>
                    </div>
                 </div>

                 <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm tích lũy</p>
                       <p className="text-lg font-black text-indigo-600 italic">{customer.points} <span className="text-[10px] opacity-50 not-italic">Pts</span></p>
                    </div>
                    <div className="text-right">
                       <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"><History size={16}/></button>
                    </div>
                 </div>

                 <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Gia nhập: {new Date(customer.created_at).toLocaleDateString('vi-VN')}</p>
                    <button className="text-xs font-black text-indigo-500 hover:underline">Chi tiết</button>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Khách hàng mới</h2>
              <form onSubmit={handleAddCustomer} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên khách hàng</label>
                    <input name="name" type="text" placeholder="VD: Anh Hoàng" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <input name="phone" type="tel" placeholder="VD: 0912345678" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500" />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Quay lại</button>
                    <button disabled={saving} type="submit" className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-xl shadow-xl flex items-center justify-center gap-2">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : 'ĐĂNG KÝ THÀNH VIÊN'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
