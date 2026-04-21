'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Package, Users, BarChart3, Settings, LogOut, Grid2X2, FlaskConical, Database, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', href: '/dashboard', activeColor: 'bg-indigo-600 shadow-indigo-200', hoverColor: 'hover:bg-indigo-50 hover:text-indigo-600' },
    { icon: <Store size={20} />, label: 'Quầy POS', href: '/dashboard/pos', activeColor: 'bg-emerald-500 shadow-emerald-200', hoverColor: 'hover:bg-emerald-50 hover:text-emerald-500' },
    { icon: <Grid2X2 size={20} />, label: 'Phòng / Bàn', href: '/dashboard/tables', activeColor: 'bg-amber-500 shadow-amber-200', hoverColor: 'hover:bg-amber-50 hover:text-amber-500' },
    { icon: <Package size={20} />, label: 'Sản phẩm', href: '/dashboard/products', activeColor: 'bg-blue-500 shadow-blue-200', hoverColor: 'hover:bg-blue-50 hover:text-blue-500' },
    { icon: <Database size={20} />, label: 'Kho hàng', href: '/dashboard/inventory', activeColor: 'bg-fuchsia-500 shadow-fuchsia-200', hoverColor: 'hover:bg-fuchsia-50 hover:text-fuchsia-500' },
    { icon: <FlaskConical size={20} />, label: 'Nguyên liệu', href: '/dashboard/ingredients', activeColor: 'bg-cyan-500 shadow-cyan-200', hoverColor: 'hover:bg-cyan-50 hover:text-cyan-500' },
    { icon: <Users size={20} />, label: 'Khách hàng', href: '/dashboard/customers', activeColor: 'bg-pink-500 shadow-pink-200', hoverColor: 'hover:bg-pink-50 hover:text-pink-500' },
    { icon: <Users size={20} />, label: 'Nhân viên', href: '/dashboard/employees', activeColor: 'bg-violet-500 shadow-violet-200', hoverColor: 'hover:bg-violet-50 hover:text-violet-500' },
    { icon: <BarChart3 size={20} />, label: 'Báo cáo', href: '/dashboard/reports', activeColor: 'bg-rose-500 shadow-rose-200', hoverColor: 'hover:bg-rose-50 hover:text-rose-500' },
    { icon: <Settings size={20} />, label: 'Cài đặt', href: '/dashboard/settings', activeColor: 'bg-slate-700 shadow-slate-200', hoverColor: 'hover:bg-slate-100 hover:text-slate-700' },
  ];

  if (profile?.role === 'super_admin') {
    navItems.unshift({ icon: <ShieldCheck size={20} />, label: 'Hệ thống', href: '/dashboard/admin', activeColor: 'bg-red-600 shadow-red-200', hoverColor: 'hover:bg-red-50 hover:text-red-600' });
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
      <div className="p-8 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Store size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 leading-none truncate w-40">{profile?.shops?.name || 'Cửa hàng hệ thống'}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{profile?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          // Check if active (exact match for dashboard, prefix match for others)
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm group ${
                isActive 
                  ? `${item.activeColor} text-white shadow-lg` 
                  : `text-slate-500 ${item.hoverColor}`
              }`}
            >
              <span className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t border-slate-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold text-sm">
            <LogOut size={20} />
            Đăng xuất
          </button>
      </div>
    </aside>
  );
}
