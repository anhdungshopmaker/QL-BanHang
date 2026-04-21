'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError('Email hoặc mật khẩu không chính xác, vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden border border-slate-100">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Building2 size={200} className="-rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">POS SAAS</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Management Portal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
              <input name="email" type="email" placeholder="Email của bạn" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
              <input name="password" type="password" placeholder="Mật khẩu" required className="pl-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" />
            </div>

            {error && <p className="text-xs font-bold text-rose-500 px-2">{error}</p>}

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  ĐĂNG NHẬP HỆ THỐNG
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col gap-4">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              Gia nhập cửa hàng mới? <Link href="/register" className="text-indigo-600 hover:underline">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
