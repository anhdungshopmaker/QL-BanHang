import { Settings, Save, Store, Shield } from 'lucide-react';

export const metadata = {
  title: 'Cài đặt - Quản lý Bán Hàng',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Cài đặt Hệ thống</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Tùy chỉnh thông tin cửa hàng, hóa đơn và bảo mật</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
          <Save size={18} />
          Lưu thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Store size={20} /></div>
              <h2 className="text-lg font-bold text-slate-900">Thông tin Cửa hàng</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên cửa hàng</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-medium" placeholder="Ví dụ: Cà Phê Gió" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Số điện thoại</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-medium" placeholder="0901234567" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Địa chỉ</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-medium" placeholder="Số 1 Đường Số 2..." />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           {/* Security Settings */}
           <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Shield size={20} /></div>
              <h2 className="text-lg font-bold text-slate-900">Bảo mật</h2>
            </div>
            <div className="space-y-4">
               <button className="w-full justify-start text-left px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-700 text-sm">
                 Đổi mật khẩu
               </button>
               <button className="w-full justify-start text-left px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-700 text-sm">
                 2-Factor Authentication (2FA)
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
