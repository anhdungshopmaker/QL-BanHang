import { Users, UserPlus, FileSpreadsheet } from 'lucide-react';

export const metadata = {
  title: 'Nhân viên - Quản lý Bán Hàng',
};

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý Nhân Viên</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Theo dõi hoạt động, phân quyền và hiệu suất nhân viên</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors">
            <FileSpreadsheet size={18} />
            Xuất Excel
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            <UserPlus size={18} />
            Thêm Nhân viên
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
          <Users size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Tính năng đang phát triển</h3>
        <p className="text-slate-500 max-w-md">
          Bảng phân quyền và theo dõi ca làm việc của nhân viên đang được chúng tôi hoàn thiện. Bạn sẽ sớm có thể mời nhân viên vào cửa hàng!
        </p>
      </div>
    </div>
  );
}
