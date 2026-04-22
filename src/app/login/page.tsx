'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Store, User2, Lock, Hash, ArrowRight, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'standard' | 'enterprise'>('enterprise');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    try {
      let email = '';

      if (loginMode === 'enterprise') {
        const shopCode = (formData.get('shopCode') as string).trim().toUpperCase();
        const staffCode = (formData.get('staffCode') as string).trim().toUpperCase();
        const username = (formData.get('username') as string).trim().toLowerCase();

        // 1. Find Shop
        const { data: shop, error: shopErr } = await supabase
          .from('shops')
          .select('id')
          .eq('code', shopCode)
          .single();
        
        if (shopErr || !shop) throw new Error('Mã cửa hàng "' + shopCode + '" không tồn tại');

        // 2. Find Profile WITHIN that shop
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('email, role, shop_id')
          .eq('shop_id', shop.id) // Strict scope
          .eq('staff_code', staffCode)
          .eq('username', username)
          .single();
        
        if (profErr || !profile) {
          throw new Error('Thông tin nhân viên không chính xác trong cửa hàng này');
        }

        // ❌ SECURITY: NEVER allow super_admin to login via staff flow
        if (profile.role === 'super_admin') {
          throw new Error('Tài khoản quản trị hệ thống phải đăng nhập qua tab "HỆ THỐNG"');
        }
        
        email = profile.email;
      } else {
        // 🔐 ADMIN / OWNER FLOW (Standard Email)
        email = (formData.get('email') as string || '').trim().toLowerCase();
      }

      // 3. Auth with Supabase
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 4. VERIFY ROLE for Admin flow
      if (loginMode === 'standard') {
        const { data: adminProf } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .single();
        
        if (adminProf?.role !== 'super_admin') {
          await supabase.auth.signOut();
          throw new Error('Bạn không có quyền truy cập vào khu vực Hệ thống');
        }
      }

      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 relative overflow-hidden border border-slate-100">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Store size={200} className="rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">POS ACCESS</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Hệ thống quản lý đa cửa hàng</p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setLoginMode('enterprise')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'enterprise' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cửa hàng
            </button>
            <button 
              onClick={() => setLoginMode('standard')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hệ thống
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === 'enterprise' ? (
              <>
                <div className="relative">
                  <Hash className="absolute left-4 top-4 text-slate-400" size={18} />
                  <input name="shopCode" type="text" placeholder="Mã cửa hàng" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-black text-indigo-600 placeholder:font-bold uppercase" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User2 className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input name="username" type="text" placeholder="User" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-bold" />
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input name="staffCode" type="text" placeholder="Mã NV" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-bold uppercase" />
                  </div>
                </div>
              </>
            ) : (
              <div className="relative">
                <User2 className="absolute left-4 top-4 text-slate-400" size={18} />
                <input name="email" type="email" placeholder="Email Admin" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
              <input name="password" type="password" placeholder="Mật khẩu" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                 <p className="text-[11px] font-black text-rose-500 uppercase tracking-tighter leading-tight">{error}</p>
              </div>
            )}

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  ĐĂNG NHẬP {loginMode === 'standard' ? 'HỆ THỐNG' : 'CỬA HÀNG'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-50 text-center space-y-4">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               Quản trị viên? <Link href="/register" className="text-indigo-600 hover:underline">Đăng ký shop mới</Link>
             </p>
             <div className="flex items-center justify-center gap-2 text-slate-300">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Secure SaaS POS v2.0</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
