'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Calendar, Users, Package, ArrowUpRight, DollarSign, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const supabase = createClient();

  const fetchReports = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();

    if (!profile?.shop_id) { setLoading(false); return; }

    // Build date filter based on timeRange
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string = now.toISOString();

    if (timeRange === 'today') {
      const d = new Date(now); d.setHours(0,0,0,0);
      startDate = d.toISOString();
    } else if (timeRange === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      startDate = d.toISOString();
    } else if (timeRange === 'month') {
      const d = new Date(now); d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString();
    } else if (timeRange === 'year') {
      const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString();
    }

    // 1. Get orders filtered by shop + date range
    let ordersQuery = supabase
      .from('orders')
      .select('id, total_amount')
      .eq('shop_id', profile.shop_id)
      .eq('status', 'completed')
      .lte('created_at', endDate);
    if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate);
    const { data: orders } = await ordersQuery;

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const totalOrders = orders?.length || 0;

    // 2. Get top products — scoped to THIS shop's orders only via inner join
    let itemsQuery = supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        products(name, category),
        orders!inner(shop_id, created_at, status)
      `)
      .eq('orders.shop_id', profile.shop_id)
      .eq('orders.status', 'completed')
      .lte('orders.created_at', endDate);
    if (startDate) itemsQuery = itemsQuery.gte('orders.created_at', startDate);

    const { data: items } = await itemsQuery;

    let topProducts: any[] = [];
    if (items && items.length > 0) {
      const productStats: Record<string, any> = {};
      items.forEach((item: any) => {
        if (!item.products) return;
        const name = item.products.name;
        if (!productStats[name]) productStats[name] = { name, quantity: 0, revenue: 0 };
        productStats[name].quantity += item.quantity;
        productStats[name].revenue += item.quantity * Number(item.price);
      });
      topProducts = Object.values(productStats).sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5);
    }

    setStats({ totalRevenue, totalOrders });
    setTopProducts(topProducts);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [timeRange]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trung tâm Báo cáo</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Phân tích kinh doanh & Lợi nhuận</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
           {['today', 'week', 'month', 'year'].map(r => (
             <button 
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${timeRange === r ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {r === 'today' ? 'Hôm nay' : r === 'week' ? 'Tuần' : r === 'month' ? 'Tháng' : 'Năm'}
             </button>
           ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 p-12 bg-white/5 rounded-full"><DollarSign size={80}/></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Tổng doanh thu</p>
            <h2 className="text-4xl font-black italic">{Intl.NumberFormat('vi-VN').format(stats.totalRevenue)}đ</h2>
            <div className="flex items-center gap-2 mt-6 text-xs font-bold text-indigo-200">
               <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white"><ArrowUpRight size={12}/></div>
               <span>+14.5% so với cùng kỳ</span>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng đơn hàng</p>
            <h2 className="text-3xl font-black text-slate-900">{stats.totalOrders} đơn</h2>
            <p className="text-xs font-bold text-slate-400 mt-6 italic">Trung bình {Math.round(stats.totalRevenue / (stats.totalOrders || 1)).toLocaleString()}đ / đơn</p>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hiệu suất bán hàng</p>
              <h2 className="text-3xl font-black text-emerald-500 tracking-tighter">TĂNG TRƯỞNG</h2>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full mt-4 overflow-hidden">
               <div className="h-full bg-indigo-600 rounded-full" style={{ width: '75%' }}></div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Top Products Table */}
         <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Top Sản phẩm bán chạy</h3>
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Package size={20}/></div>
            </div>
            <div className="space-y-8">
               {topProducts.map((p, i) => (
                 <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400">{i+1}</div>
                       <div>
                          <p className="text-sm font-black text-slate-800">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{p.quantity} lượt bán</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-900">{Intl.NumberFormat('vi-VN').format(p.revenue)}đ</p>
                       <div className="h-1.5 w-24 bg-slate-50 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.revenue / stats.totalRevenue) * 500}%` }}></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Revenue Chart Visual Area */}
         <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-50/50 flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 size={64} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Biểu đồ đang được xử lý...</p>
                    <p className="text-[10px] text-slate-300 mt-2">Dữ liệu thời gian thực đồng bộ từ POS</p>
                </div>
            </div>
            <div className="relative opacity-10">
               <h3 className="text-xl font-black text-slate-900 mb-10">Xu hướng doanh thu</h3>
               <div className="flex items-end gap-4 h-64">
                  {Array(10).fill(0).map((_, i) => (
                      <div key={i} className="flex-1 bg-indigo-600 rounded-t-xl" style={{ height: `${Math.random() * 100}%` }}></div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
