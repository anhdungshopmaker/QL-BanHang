import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Store, Package, Users, BarChart3, Settings, LogOut, Menu, Grid2X2, FlaskConical, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import RealtimeOrderNotify from '@/components/RealtimeOrderNotify';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, shops(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.shop_id && profile?.role !== 'super_admin') {
    // Should verify if they need to join or create a shop
    // redirect('/register');
  }

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', href: '/dashboard' },
    { icon: <Store size={20} />, label: 'Quầy POS', href: '/dashboard/pos' },
    { icon: <Grid2X2 size={20} />, label: 'Phòng / Bàn', href: '/dashboard/tables' },
    { icon: <Package size={20} />, label: 'Sản phẩm', href: '/dashboard/products' },
    { icon: <Database size={20} />, label: 'Kho hàng', href: '/dashboard/inventory' },
    { icon: <FlaskConical size={20} />, label: 'Nguyên liệu', href: '/dashboard/ingredients' },
    { icon: <Users size={20} />, label: 'Khách hàng', href: '/dashboard/customers' },
    { icon: <Users size={20} />, label: 'Nhân viên', href: '/dashboard/employees' },
    { icon: <BarChart3 size={20} />, label: 'Báo cáo', href: '/dashboard/reports' },
    { icon: <Settings size={20} />, label: 'Cài đặt', href: '/dashboard/settings' },
  ];

  if (profile?.role === 'super_admin') {
    navItems.unshift({ icon: <ShieldCheck size={20} />, label: 'Hệ thống', href: '/dashboard/admin' });
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <RealtimeOrderNotify />
      {/* Sidebar */}
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

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all font-bold text-sm group"
            >
              <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
            <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm">
              <LogOut size={20} />
              Đăng xuất
            </button>
        </div>
      </aside>

      {/* Main Content */}
       <main className="flex-1 flex flex-col overflow-hidden">
         <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4 lg:hidden">
              <button className="p-2 bg-slate-100 rounded-lg text-slate-500"><Menu size={20} /></button>
              <h1 className="font-black text-slate-900">POS SAAS</h1>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chào buổi sáng,</p>
              <h1 className="text-lg font-black text-slate-900">{profile?.full_name || 'Quản lý'} 👋</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-black text-slate-900">{profile?.shops?.code || 'SYSTEM'}</p>
                 <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded-md mt-1">Gói Premium</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-black text-slate-500 text-sm italic">
                {profile?.full_name?.[0] || 'U'}
              </div>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
           {children}
         </div>
       </main>
    </div>
  );
}
