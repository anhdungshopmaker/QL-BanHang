import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import RealtimeOrderNotify from '@/components/RealtimeOrderNotify';
import Sidebar from '@/components/Sidebar';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng,';
  if (hour < 18) return 'Chào buổi chiều,';
  return 'Chào buổi tối,';
}

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

  // SaaS ACCESS CONTROL
  if (profile?.role !== 'super_admin') {
    // Check if account is active
    if (profile?.is_active === false) {
      redirect('/login?error=account_deactivated');
    }

    if (!profile?.shop_id) {
       // Optional: Redirect to shop creation
    } else {
       const shop = profile.shops;
       const isExpired = shop?.expires_at ? new Date(shop.expires_at) < new Date() : false;
       
       if (shop?.status === 'locked' || isExpired) {
         redirect('/blocked');
       }
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <RealtimeOrderNotify />
      <Sidebar profile={profile} />
      {/* Main Content */}
       <main className="flex-1 flex flex-col overflow-hidden">
         <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4 lg:hidden">
              <button className="p-2 bg-slate-100 rounded-lg text-slate-500"><Menu size={20} /></button>
              <h1 className="font-black text-slate-900">POS SAAS</h1>
            </div>
            <div className="hidden lg:flex items-center gap-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{getGreeting()}</p>
                <h1 className="text-lg font-black text-slate-900 leading-none mt-1">{profile?.full_name || 'Người dùng'} 👋</h1>
                <p className="text-[10px] font-black text-indigo-500 mt-1.5 uppercase tracking-widest">Vai trò: {profile?.role?.toUpperCase() || 'STAFF'}</p>
              </div>

              {profile?.shops && (
                <div className="h-10 w-px bg-slate-200 mx-2"></div>
              )}
              
              {profile?.shops && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang làm việc tại</p>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-base font-black text-indigo-900">{profile.shops.name}</h2>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase border border-indigo-100">
                      MÃ: {profile.shops.code}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-black text-slate-900">{profile?.email || 'System'}</p>
                 <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-emerald-100">Đang hoạt động</p>
              </div>
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center font-black text-lg">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
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
