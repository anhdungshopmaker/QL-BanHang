import { Store, TrendingUp, Users, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function DashboardOverview() {
  const stats = [
    { label: 'Doanh thu ngày', value: '4.250.000đ', icon: <TrendingUp className="text-emerald-500" />, change: '+12%', up: true },
    { label: 'Đơn hàng mới', value: '24', icon: <Store className="text-indigo-500" />, change: '+5%', up: true },
    { label: 'Sản phẩm hết hàng', value: '03', icon: <Package className="text-rose-500" />, change: '-2%', up: false },
    { label: 'Khách hàng', value: '1,240', icon: <Users className="text-blue-500" />, change: '+18%', up: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
              <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Biểu đồ doanh thu</h3>
              <select className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none">
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
              </select>
            </div>
            <div className="flex items-center justify-center h-64 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
               <p className="text-xs font-bold text-slate-400">Đang chuẩn bị dữ liệu báo cáo...</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Món bán chạy</h3>
            <div className="space-y-6">
               {[
                 { name: 'Phở bò đặc biệt', price: '65k', sales: 42 },
                 { name: 'Cà phê muối', price: '35k', sales: 38 },
                 { name: 'Bánh mì Oanh', price: '25k', sales: 29 },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs">{i+1}</div>
                      <div>
                        <p className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{item.sales}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Đơn</p>
                    </div>
                 </div>
               ))}
            </div>
            <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg active:scale-95">Xem chi tiết</button>
         </div>
      </div>
    </div>
  );
}
