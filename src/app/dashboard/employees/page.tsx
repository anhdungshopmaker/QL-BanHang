'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, UserPlus, Loader2, Trash2, ShieldCheck, 
  Hash, Copy, Check, X, KeyRound, UserCheck, Save
} from 'lucide-react';

export default function EmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);
  
  // New User Form
  const [newUser, setNewUser] = useState({ 
    fullName: '', 
    username: '', 
    password: '', 
    staffCode: '' 
  });
  const [creating, setCreating] = useState(false);
  
  const supabase = createClient();

  const generateStaffCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    const n = () => Math.floor(Math.random() * 10);
    return `${l1}${l2}${n()}${n()}`;
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*, shops(*)').eq('id', user?.id).single();

    if (profile) {
      setMyProfile(profile);
      const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false });
      setProfiles(employees || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateUser = async () => {
    if (!newUser.fullName || !newUser.username || !newUser.password) {
      return alert('Vui lòng điền đầy đủ thông tin');
    }
    
    setCreating(true);
    const staffCode = newUser.staffCode || generateStaffCode();
    
    // We create a "virtual" email for internal auth: username.code@shopcode.pos
    const virtualEmail = `${newUser.username}.${staffCode}@${myProfile.shops.code}.pos`.toLowerCase();

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: virtualEmail,
          password: newUser.password,
          fullName: newUser.fullName,
          role: 'staff',
          shopId: myProfile.shop_id,
          username: newUser.username,
          staffCode: staffCode
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      alert('Tạo nhân viên thành công!');
      setShowAddModal(false);
      setNewUser({ fullName: '', username: '', password: '', staffCode: '' });
      fetchData();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Nhân Sự</h1>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest italic">Cửa hàng: {myProfile?.shops?.name} ({myProfile?.shops?.code})</p>
        </div>
        
        {myProfile?.role === 'shop_admin' && (
          <button 
            onClick={() => {
              setNewUser({ ...newUser, staffCode: generateStaffCode() });
              setShowAddModal(true);
            }} 
            className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            <UserPlus size={18} /> Thêm nhân viên mới
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-slate-50/50">
               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-6">Thành viên / Username</th>
                  <th className="p-6">Mã NV</th>
                  <th className="p-6">Quyền hạn</th>
                  <th className="p-6">Ngày tham gia</th>
                  <th className="p-6 text-right">Thao tác</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {profiles.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50/30 transition-all group ${!p.is_active ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                     <td className="p-6">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic ${p.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                              {p.full_name?.[0] || 'U'}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-800">{p.full_name || 'N/A'}</p>
                              <p className="text-[10px] font-bold text-indigo-500">@{p.username || 'admin'}</p>
                           </div>
                        </div>
                     </td>
                     <td className="p-6">
                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                           {p.staff_code || 'ADMIN'}
                        </span>
                     </td>
                     <td className="p-6">
                        <div className="flex flex-col gap-1.5">
                           <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter w-fit ${p.role === 'shop_admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                              {p.role === 'shop_admin' ? 'Chủ quán' : 'Nhân viên'}
                           </span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest w-fit ${p.is_active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                              {p.is_active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                           </span>
                        </div>
                     </td>
                     <td className="p-6 text-xs font-bold text-slate-400">
                        {new Date(p.created_at).toLocaleDateString('vi-VN')}
                     </td>
                     <td className="p-6 text-right">
                        {myProfile?.role === 'shop_admin' && p.role !== 'shop_admin' && (
                           <button 
                             onClick={async () => {
                               const newStatus = !p.is_active;
                               if (confirm(`Bạn có chắc chắn muốn ${newStatus ? 'KÍCH HOẠT LẠI' : 'VÔ HIỆU HÓA'} nhân viên này?`)) {
                                 const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', p.id);
                                 if (error) alert(error.message);
                                 else fetchData();
                               }
                             }}
                             className={`p-2 rounded-lg transition-all ${p.is_active ? 'text-rose-300 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-300 hover:text-emerald-600 hover:bg-emerald-50'}`}
                             title={p.is_active ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                           >
                              {p.is_active ? <X size={18} /> : <UserCheck size={18} />}
                           </button>
                        )}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xl font-black text-slate-900">Nhân viên mới</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24}/></button>
               </div>
               <div className="p-8 space-y-5">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và tên</label>
                     <input type="text" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20" placeholder="VD: Nguyễn Văn A" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên đăng nhập</label>
                       <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase()})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-black text-indigo-600 outline-none" placeholder="nva_pos" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã nhân viên (AB12)</label>
                       <input type="text" value={newUser.staffCode} onChange={e => setNewUser({...newUser, staffCode: e.target.value.toUpperCase()})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu ban đầu</label>
                     <div className="relative">
                        <KeyRound className="absolute left-4 top-3.5 text-slate-300" size={18} />
                        <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                           className="pl-12 w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none" placeholder="••••••••" />
                     </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[9px] font-bold text-amber-700 leading-tight">
                      Mật khẩu này sẽ được dùng để đăng nhập cùng với Mã Cửa Hàng và Mã Nhân Viên. Hãy bàn giao cẩn thận cho nhân viên.
                    </p>
                  </div>

                  <button 
                    disabled={creating}
                    onClick={handleCreateUser}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="animate-spin" size={18} /> : <> <Save size={18} /> XÁC NHẬN THÊM </>}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
