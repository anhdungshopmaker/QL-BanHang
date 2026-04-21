'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, QrCode, Loader2, Grid2X2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function TableManagement() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTable, setNewTable] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [origin, setOrigin] = useState('');
  const supabase = createClient();

  // Capture window.location.origin only on client
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id, shops!inner(code)').eq('id', user?.id).single();
    
    if (profile && profile.shops) {
      const shops = profile.shops as any;
      setShopCode(shops.code);
      const { data } = await supabase.from('tables').select('*').eq('shop_id', profile.shop_id).order('table_number');
      setTables(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user?.id).single();

    const { error } = await supabase.from('tables').insert({ 
      shop_id: profile?.shop_id, 
      table_number: newTable 
    });

    if (!error) {
      setNewTable('');
      fetchData();
    }
  };

  const deleteTable = async (id: string) => {
    if (confirm('Xóa bàn này?')) {
      await supabase.from('tables').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Phòng / Bàn</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Thiết lập vị trí & QR Menu</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <form onSubmit={handleAddTable} className="flex gap-4 mb-10">
          <input 
            type="text" 
            placeholder="Tên bàn mới (VD: Bàn 01, VIP 02...)" 
            value={newTable}
            onChange={e => setNewTable(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" 
          />
          <button className="bg-slate-900 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
            <Plus size={20} />
            THÊM BÀN
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-200" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map(table => {
              const qrUrl = `${origin}/order/${shopCode}/${table.id}`;
              return (
                <div key={table.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-2xl transition-all group relative">
                   <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Grid2X2 size={24} />
                      </div>
                      <button onClick={() => deleteTable(table.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                   </div>
                   <h3 className="text-lg font-black text-slate-900 mb-6">{table.table_number}</h3>
                   
                   <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center gap-4">
                      <QRCodeSVG value={qrUrl} size={120} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Quét để đặt món<br />tại {table.table_number}</p>
                   </div>

                   <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => window.open(qrUrl, '_blank')}
                        className="flex-1 py-3 bg-white text-indigo-600 border border-indigo-100 font-black text-[10px] uppercase rounded-xl hover:bg-indigo-50 transition-all"
                      >
                        XEM MENU
                      </button>
                      <button className="flex-1 py-3 bg-white text-slate-600 border border-slate-100 font-black text-[10px] uppercase rounded-xl hover:bg-slate-50 transition-all">
                        IN MÃ
                      </button>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
