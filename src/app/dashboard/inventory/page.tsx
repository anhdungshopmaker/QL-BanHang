'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, ArrowDown, ArrowUp, History, Loader2, AlertTriangle, PlusCircle } from 'lucide-react';

export default function InventoryDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data: ingredients } = await supabase.from('ingredients').select('*').order('stock_quantity', { ascending: true });
    const { data: recentLogs } = await supabase.from('inventory_logs').select('*, ingredients(name, unit)').order('created_at', { ascending: false }).limit(50);
    
    setItems(ingredients || []);
    setLogs(recentLogs || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStock = async () => {
    if (!amount || !showStockModal) return;
    setSaving(true);
    
    const change = parseFloat(amount);
    
    // 1. Update ingredient quantity
    const { error: updErr } = await supabase.rpc('increment_stock', { 
        row_id: showStockModal.id, 
        amount: change 
    });

    // Fallback if rpc is not defined:
    if (updErr) {
        await supabase.from('ingredients').update({ 
            stock_quantity: (showStockModal.stock_quantity || 0) + change 
        }).eq('id', showStockModal.id);
    }

    // 2. Log change
    await supabase.from('inventory_logs').insert({
        ingredient_id: showStockModal.id,
        change_amount: change,
        reason: 'Nhập hàng thủ công'
    });

    setShowStockModal(null);
    setAmount('');
    fetchData();
    setSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Tồn kho</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Xuất nhập kho & Cảnh báo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Inventory List */}
         <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <h3 className="text-lg font-black text-slate-900">Trạng thái tồn kho</h3>
               <span className="text-[10px] font-black bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">Tất cả nguyên liệu</span>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="p-6">Nguyên liệu</th>
                        <th className="p-6">Đơn vị</th>
                        <th className="p-6">Hiện có</th>
                        <th className="p-6">Trạng thái</th>
                        <th className="p-6"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {loading ? (
                        <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200"/></td></tr>
                     ) : items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                           <td className="p-6 font-black text-sm text-slate-800">{item.name}</td>
                           <td className="p-6 text-xs text-slate-400 font-bold">{item.unit}</td>
                           <td className="p-6">
                              <span className={`text-sm font-black ${item.stock_quantity < 5 ? 'text-rose-500' : 'text-slate-900'}`}>
                                 {item.stock_quantity}
                              </span>
                           </td>
                           <td className="p-6">
                              {item.stock_quantity < 5 ? (
                                 <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm animate-pulse">
                                    <AlertTriangle size={12}/> Sắp hết!
                                 </span>
                              ) : (
                                 <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-tighter">Bình thường</span>
                              )}
                           </td>
                           <td className="p-6 text-right">
                              <button 
                                onClick={() => setShowStockModal(item)}
                                className="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                              >
                                <PlusCircle size={18} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Recent Logs */}
         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
               <History className="text-slate-400" size={24} />
               <h3 className="text-lg font-black text-slate-900">Biến động kho</h3>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
               {logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                     <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${log.change_amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {log.change_amount > 0 ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                     </div>
                     <div className="flex-1 min-w-0 border-b border-slate-50 pb-4">
                        <p className="text-xs font-black text-slate-800 truncate">{log.ingredients?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.reason}</p>
                        <div className="flex items-center justify-between mt-2">
                           <span className={`text-[10px] font-black ${log.change_amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {log.change_amount > 0 ? '+' : ''}{log.change_amount} {log.ingredients?.unit}
                           </span>
                           <span className="text-[9px] text-slate-300 font-bold">{new Date(log.created_at).toLocaleTimeString('vi-VN')}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* STOCK MODAL */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-black text-slate-900 mb-2">Nhập kho bổ sung</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">{showStockModal.name}</p>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng nhập ({showStockModal.unit})</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner" 
                    />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setShowStockModal(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Hủy</button>
                    <button 
                      disabled={saving || !amount}
                      onClick={handleUpdateStock}
                      className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                       {saving ? <Loader2 size={18} className="animate-spin" /> : 'XÁC NHẬN NHẬP'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
