'use client';

import { createClient } from '@/lib/supabase/client';
import { Lock, LogOut, Clock, ShieldAlert } from 'lucide-react';

export default function BlockedPage() {
  const supabase = createClient();

  return (
    <div className="h-screen w-full bg-slate-50 flex items-center justify-center p-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
         <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
            <Lock size={48} />
         </div>
         
         <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">TRUY CẬP BỊ GIỚI HẠN</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
               <ShieldAlert size={14} className="text-rose-500" /> Cửa hàng đang bị tạm khóa
            </p>
         </div>

         <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100">
            <p className="text-sm font-bold text-slate-600 leading-relaxed">
               Tài khoản hoặc cửa hàng của bạn hiện đang ở trạng thái <span className="text-rose-500">Khóa</span> hoặc <span className="text-rose-500">Hết hạn gói dịch vụ</span>.
            </p>
            <div className="mt-4 flex items-center gap-3 text-indigo-600">
               <Clock size={16} />
               <p className="text-[11px] font-black uppercase tracking-wider">Vui lòng liên hệ Admin hệ thống</p>
            </div>
         </div>

         <form action="/api/auth/signout" method="POST">
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
            >
               <LogOut size={18} /> Đăng xuất tài khoản
            </button>
         </form>
      </div>
    </div>
  );
}
