import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import RealtimeOrderNotify from '@/components/RealtimeOrderNotify';
import Sidebar from '@/components/Sidebar';

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
