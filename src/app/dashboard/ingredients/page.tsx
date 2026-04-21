'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FlaskConical, Plus, Search, Edit2, Trash2, Loader2, Database } from 'lucide-react';

export default function IngredientManagement() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchIngredients = async () => {
    setLoading(true);
    const { data } = await supabase.from('ingredients').select('*').order('name');
    setIngredients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchIngredients(); }, []);

  const handleAddIngredient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();

    const newIngredient = {
      name: formData.get('name') as string,
      unit: formData.get('unit') as string,
      unit_cost: parseFloat(formData.get('unit_cost') as string),
      shop_id: profile?.shop_id
    };

    const { error } = await supabase.from('ingredients').insert(newIngredient);
    if (!error) {
       setShowAddModal(false);
       fetchIngredients();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kho Nguyên liệu</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Quản lý định mức & Giá vốn</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-indigo-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          THÊM NGUYÊN LIỆU
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-3 text-slate-400" size={16} />
              <input type="text" placeholder="Tìm tên nguyên liệu..." className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-100" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên nguyên liệu</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá vốn / Đơn vị</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={4} className="p-10"><div className="h-4 bg-slate-50 rounded w-full"></div></td></tr>
                ))
              ) : ingredients.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-xs font-bold text-slate-300 uppercase italic">Chưa có dữ liệu</td></tr>
              ) : ingredients.map(ing => (
                <tr key={ing.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black"><FlaskConical size={18}/></div>
                       <span className="text-sm font-black text-slate-800">{ing.name}</span>
                    </div>
                  </td>
                  <td className="p-6 italic text-xs font-bold text-slate-400">{ing.unit}</td>
                  <td className="p-6">
                     <span className="text-sm font-black text-indigo-600">{Intl.NumberFormat('vi-VN').format(ing.unit_cost)}đ</span>
                  </td>
                  <td className="p-6 text-right">
                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                        <button className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16}/></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Nguyên liệu mới</h2>
              <form onSubmit={handleAddIngredient} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên nguyên liệu / Vật tư</label>
                    <input name="name" type="text" placeholder="VD: Hạt cà phê robusta" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị (Kg, L, Gram...)</label>
                       <input name="unit" type="text" placeholder="Kg" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá nhập / Đơn vị</label>
                       <input name="unit_cost" type="number" placeholder="250000" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500" />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Hủy</button>
                    <button disabled={saving} type="submit" className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-xl shadow-xl flex items-center justify-center gap-2">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : 'LƯU DỮ LIỆU'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
