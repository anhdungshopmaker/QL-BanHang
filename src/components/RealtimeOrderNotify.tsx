'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBasket, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Create supabase client OUTSIDE the component so it's stable across renders
const supabase = createClient();

export default function RealtimeOrderNotify() {
  const [newOrder, setNewOrder] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new.order_source === 'qr_menu') {
            setNewOrder(payload.new);
            try { new Audio('/notification.mp3').play(); } catch (_) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // stable — supabase instance never changes

  if (!newOrder) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
       <div className="w-80 bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl ring-8 ring-indigo-50 border border-slate-700 relative">
          <button
            onClick={() => setNewOrder(null)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X size={18}/>
          </button>

          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center relative flex-shrink-0">
                <ShoppingBasket size={24} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900 animate-ping"></div>
             </div>
             <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Đơn hàng mới!</p>
                <h4 className="text-sm font-black italic">
                  Mã đơn: #{String(newOrder.id).slice(0, 5).toUpperCase()}
                </h4>
             </div>
          </div>

          <div className="space-y-2 mb-6">
            <p className="text-xs font-bold text-slate-400">
              Số tiền: <span className="text-white font-black">{Intl.NumberFormat('vi-VN').format(newOrder.total_amount)}đ</span>
            </p>
            <p className="text-xs font-bold text-slate-400">
              Nguồn: <span className="text-indigo-400 font-black uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded ml-1">QR MENU</span>
            </p>
          </div>

          <button
            onClick={() => {
              router.push('/dashboard/orders');
              setNewOrder(null);
            }}
            className="w-full bg-white text-slate-900 font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95"
          >
            XỬ LÝ NGAY
            <ArrowRight size={18} />
          </button>
       </div>
    </div>
  );
}
