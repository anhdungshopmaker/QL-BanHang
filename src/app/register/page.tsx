'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, User2, Mail, Lock, Store, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'join'>('join');
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const shopName = formData.get('shopName') as string;
    const joinCode = formData.get('joinCode') as string;

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Không thể tạo tài khoản');

      // 2. Handling Shop logic (In production, move this to a secure edge function / route handler)
      // For Phase 1 demo, we'll assume a profile is created via trigger
      
      if (mode === 'create') {
        // Create new shop
        const shopCode = 'S' + Math.floor(1000 + Math.random() * 9000);
        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .insert({ name: shopName, code: shopCode })
          .select()
          .single();

        if (shopError) throw shopError;

        // Update profile role
        await supabase
          .from('profiles')
          .update({ shop_id: shop.id, role: 'shop_admin' })
          .eq('id', authData.user.id);

      } else if (mode === 'join') {
        // Join existing shop
        const { data: invite, error: inviteError } = await supabase
          .from('shop_invites')
          .select('*')
          .eq('invite_code', joinCode)
          .eq('is_used', false)
          .single();

        if (inviteError || !invite) throw new Error('Mã mời không chính xác hoặc đã hết hạn');

        // Update profile role
        await supabase
          .from('profiles')
          .update({ shop_id: invite.shop_id, role: invite.role })
          .eq('id', authData.user.id);

        // Mark invite as used
        await supabase
          .from('shop_invites')
          .update({ is_used: true })
          .eq('id', invite.id);
      }

      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      let message = err.message;
      if (message.includes('infinite recursion')) {
        message = 'Lỗi hệ thống bảo mật (RLS). Vui lòng báo Admin chạy script fix RLS.';
      } else if (message.includes('already registered')) {
        message = 'Email này đã được đăng ký!';
      } else if (message.includes('invalid invite code')) {
        message = 'Mã mời không đúng hoặc đã hết hạn.';
      } else {
        message = 'Có lỗi xảy ra: ' + message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden border border-slate-100">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Store size={200} className="rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">POS SAAS</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Bắt đầu quản lý</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setMode('join')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'join' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Gia nhập Shop
            </button>
            <button 
              onClick={() => setMode('create')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tạo Shop mới
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User2 className="absolute left-4 top-4 text-slate-400" size={18} />
              <input name="fullName" type="text" placeholder="Họ và tên" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
              <input name="email" type="email" placeholder="Email đăng ký" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
              <input name="password" type="password" placeholder="Mật khẩu" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" />
            </div>

            {mode === 'create' ? (
              <div className="relative border-t border-slate-100 pt-4 mt-2">
                <Store className="absolute left-4 top-8 text-slate-400" size={18} />
                <input name="shopName" type="text" placeholder="Tên cửa hàng của bạn" required={mode === 'create'} className="pl-12 w-full bg-indigo-50/30 border border-indigo-100 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-indigo-600 placeholder:text-indigo-300" />
              </div>
            ) : (
              <div className="relative border-t border-slate-100 pt-4 mt-2">
                <LinkIcon className="absolute left-4 top-8 text-slate-400" size={18} />
                <input name="joinCode" type="text" placeholder="Nhập mã mời (Invite Code)" required={mode === 'join'} className="pl-12 w-full bg-teal-50/30 border border-teal-100 rounded-xl px-4 py-3.5 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all font-bold text-teal-600 placeholder:text-teal-300" />
              </div>
            )}

            {error && <p className="text-xs font-bold text-rose-500 px-2">{error}</p>}

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {mode === 'create' ? 'KHỞI TẠO HỆ THỐNG' : 'GIA NHẬP NGAY'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Đã có tài khoản? <Link href="/login" className="text-indigo-600 hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
