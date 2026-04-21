'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, LogOut } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Crash:", error);
  }, [error]);

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-rose-100">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Oops! Đã xảy ra lỗi hệ thống</h2>
      <p className="text-slate-500 font-medium max-w-md mb-8">
        Hệ thống không thể tải dữ liệu hồ sơ của bạn (Có thể User chưa hoàn thành quy trình tạo Cửa hàng hoặc Database mất kết nối).
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          THỬ LẠI
        </button>
        <a
          href="/api/auth/signout"
          onClick={() => { localStorage.clear(); sessionStorage.clear(); }}
          className="px-8 py-4 bg-rose-50 border border-rose-100 text-rose-600 font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          <LogOut size={18} />
          ĐĂNG XUẤT NGAY
        </a>
      </div>
      <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-300">
        Mã lỗi: {error?.message || "Unknown State"}
      </p>
    </div>
  );
}
