'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ShieldCheck, Store, Lock, Unlock, Hash, Calendar, Loader2, 
  Search, ExternalLink, Plus, Users, DollarSign, X, 
  TrendingUp, Clock, UserPlus, KeyRound, Save, Trash2
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  
  // Create Shop Form
  const [newShop, setNewShop] = useState({ name: '', code: '', expires_at: '' });
  
  // Shop Details Data
  const [shopUsers, setShopUsers] = useState<any[]>([]);
  const [shopRevenue, setShopRevenue] = useState<any>({ daily: 0, monthly: 0, yearly: 0 });
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const supabase = createClient();

  const generateShopCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    const n = () => Math.floor(Math.random() * 10);
    return `${l1}${l2}${n()}${n()}${n()}`;
  };

  const fetchShops = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    
    if (profile?.role !== 'super_admin') {
       alert('Bạn không có quyền truy cập trang này!');
       window.location.href = '/dashboard';
       return;
    }

    const { data } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    setShops(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, []);

  const handleCreateShop = async () => {
    if (!newShop.name) return alert('Vui lòng nhập tên cửa hàng');
    
    const code = newShop.code || generateShopCode();
    const expiresAt = newShop.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('shops').insert({
      name: newShop.name,
      code: code,
      expires_at: expiresAt,
      status: 'active'
    });

    if (error) {
      alert('Lỗi tạo cửa hàng: ' + error.message);
    } else {
      setShowCreateModal(false);
      setNewShop({ name: '', code: '', expires_at: '' });
      fetchShops();
    }
  };

  const openManageShop = async (shop: any) => {
    setSelectedShop(shop);
    setShowManageModal(true);
    setLoadingDetails(true);
    
    // Fetch users of this shop
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .eq('shop_id', shop.id);
    setShopUsers(users || []);

    // Fetch revenue (Day, Month, Year)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString();

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('shop_id', shop.id)
      .eq('status', 'completed');

    if (orders) {
      const daily = orders.filter(o => o.created_at >= today).reduce((s, o) => s + Number(o.total_amount), 0);
      const monthly = orders.filter(o => o.created_at >= firstDayMonth).reduce((s, o) => s + Number(o.total_amount), 0);
      const yearly = orders.filter(o => o.created_at >= firstDayYear).reduce((s, o) => s + Number(o.total_amount), 0);
      setShopRevenue({ daily, monthly, yearly });
    }

    setLoadingDetails(false);
  };

  const updateShopExpiry = async () => {
    const { error } = await supabase
      .from('shops')
      .update({ expires_at: selectedShop.expires_at })
      .eq('id', selectedShop.id);
    
    if (error) alert('Lỗi cập nhật: ' + error.message);
    else {
      alert('Đã cập nhật ngày hết hạn');
      fetchShops();
    }
  };

  const toggleShopLock = async (shopId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    const { error } = await supabase.from('shops').update({ status: newStatus }).eq('id', shopId);
    if (!error) fetchShops();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
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
         <button 
           onClick={() => {
             setNewShop({ ...newShop, code: generateShopCode() });
             setShowCreateModal(true);
           }}
           className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
         >
           <Plus size={18} /> Tạo Cửa Hàng Mới
         </button>
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shop đã khóa / Hết hạn</p>
            <h2 className="text-4xl font-black text-rose-500 leading-none">
              {shops.filter(s => s.status === 'locked' || new Date(s.expires_at) < new Date()).length}
            </h2>
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
                     <th className="p-6">Ngày hết hạn</th>
                     <th className="p-6">Trạng thái</th>
                     <th className="p-6 text-right">Hành động</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                     <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200"/></td></tr>
                  ) : shops.map(shop => {
                     const isExpired = new Date(shop.expires_at) < new Date();
                     return (
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
                           <td className="p-6">
                              <div className={`flex items-center gap-2 text-xs font-bold ${isExpired ? 'text-rose-500' : 'text-slate-600'}`}>
                                 <Clock size={14}/> {new Date(shop.expires_at).toLocaleDateString('vi-VN')}
                              </div>
                           </td>
                           <td className="p-6">
                              <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${shop.status === 'active' \u0026\u0026 !isExpired ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                                 {shop.status === 'active' \u0026\u0026 !isExpired ? 'Đang chạy' : isExpired ? 'Hết hạn' : 'Đã khóa'}
                              </span>
                           </td>
                           <td className="p-6 text-right space-x-2">
                              <button 
                               onClick={() => openManageShop(shop)}
                               className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                               title="Quản lý chi tiết"
                              >
                                 <Settings size={18}/>
                              </button>
                              <button 
                               onClick={() => toggleShopLock(shop.id, shop.status)}
                               className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-95 ${shop.status === 'active' ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                              >
                                 {shop.status === 'active' ? <Lock size={18}/> : <Unlock size={18}/>}
                              </button>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal \u0026\u0026 (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-xl font-black text-slate-900 italic">Thêm Cửa Hàng</h3>
                 <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24}/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên cửa hàng</ts-label>
                    <input 
                      type="text" value={newShop.name} onChange={e => setNewShop({...newShop, name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20" 
                      placeholder="VD: Tiệm Cà Phê Sunshine"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã định danh (Tự động AB123)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" value={newShop.code} onChange={e => setNewShop({...newShop, code: e.target.value.toUpperCase()})}
                        className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-indigo-600 outline-none" 
                      />
                      <button onClick={() => setNewShop({...newShop, code: generateShopCode()})} className="p-4 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200"><TrendingUp size={20}/></button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày hết hạn</label>
                    <input 
                      type="date" value={newShop.expires_at.split('T')[0]} 
                      onChange={e => setNewShop({...newShop, expires_at: new Date(e.target.value).toISOString()})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none" 
                    />
                 </div>
                 <button 
                  onClick={handleCreateShop}
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                 >
                   XÁC NHẬN TẠO MỚI
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MANAGE MODAL */}
      {showManageModal \u0026\u0026 selectedShop \u0026\u0026 (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><Store size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">{selectedShop.name}</h3>
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Mã: {selectedShop.code}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-slate-900"><X size={28}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-10">
                 {/* Left: General \u0026 Expiry */}
                 <div className="space-y-8">
                    <div>
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Clock size={16}/> Gói Dịch Vụ
                       </h4>
                       <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase">Ngày hết hạn hiện tại</label>
                             <input 
                               type="date" 
                               value={selectedShop.expires_at?.split('T')[0]} 
                               onChange={e => setSelectedShop({...selectedShop, expires_at: new Date(e.target.value).toISOString()})}
                               className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-slate-800 outline-none" 
                             />
                          </div>
                          <button onClick={updateShopExpiry} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                             <Save size={14}/> CẬP NHẬT NGÀY
                          </button>
                       </div>
                    </div>

                    <div>
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <DollarSign size={16}/> Doanh Thu Cửa Hàng
                       </h4>
                       <div className="grid grid-cols-1 gap-4">
                          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                             <p className="text-[9px] font-black text-emerald-600 uppercase">Hôm nay</p>
                             <p className="text-xl font-black text-emerald-700">{Intl.NumberFormat('vi-VN').format(shopRevenue.daily)}đ</p>
                          </div>
                          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                             <p className="text-[9px] font-black text-blue-600 uppercase">Tháng này</p>
                             <p className="text-xl font-black text-blue-700">{Intl.NumberFormat('vi-VN').format(shopRevenue.monthly)}đ</p>
                          </div>
                          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                             <p className="text-[9px] font-black text-indigo-600 uppercase">Năm {new Date().getFullYear()}</p>
                             <p className="text-xl font-black text-indigo-700">{Intl.NumberFormat('vi-VN').format(shopRevenue.yearly)}đ</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Right: User Management (2 columns wide) */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Users size={16}/> Quản lý Nhân sự ({shopUsers.length})
                       </h4>
                       <button className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                          <UserPlus size={14}/> Thêm tài khoản
                       </button>
                    </div>

                    <div className="bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="p-4">Email / Tên</th>
                                <th className="p-4">Vai trò</th>
                                <th className="p-4 text-right">Hành động</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {loadingDetails ? (
                                <tr><td colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-200"/></td></tr>
                             ) : shopUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/80 transition-all">
                                   <td className="p-4">
                                      <p className="text-xs font-black text-slate-800">{user.full_name || 'N/A'}</p>
                                      <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                                   </td>
                                   <td className="p-4">
                                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${user.role === 'shop_admin' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>
                                         {user.role}
                                      </span>
                                   </td>
                                   <td className="p-4 text-right space-x-1">
                                      <button className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-all" title="Reset mật khẩu">
                                         <KeyRound size={14}/>
                                      </button>
                                      <button className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-all" title="Xóa nhân viên">
                                         <Trash2 size={14}/>
                                      </button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                    
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                       <ShieldCheck className="text-amber-500 shrink-0" size={24}/>
                       <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                         Lưu ý: Mật khẩu người dùng được quản lý bởi Supabase Auth. Bạn có thể sử dụng chức năng Reset Mật Khẩu để cấp lại quyền truy cập cho nhân viên nếu họ quên.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
