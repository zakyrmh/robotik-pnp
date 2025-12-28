export default function ManagementDashboardPage() {
  return (
    <div className="h-full bg-linear-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl text-white">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">⚡ Executive Management</h2>
          <p className="text-gray-400 max-w-lg">
            Kontrol penuh atas sistem, user management, konfigurasi global, dan
            laporan audit.
          </p>
        </div>
        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
          <span className="text-xs font-mono">SYS_ADMIN_MODE</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-colors">
          <div className="text-xs text-blue-300">Total Users</div>
          <div className="text-lg font-bold">1,240</div>
        </button>
        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-colors">
          <div className="text-xs text-purple-300">System Health</div>
          <div className="text-lg font-bold text-green-400">98%</div>
        </button>
        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-colors">
          <div className="text-xs text-yellow-300">Pending Actions</div>
          <div className="text-lg font-bold">5</div>
        </button>
        <button className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-center font-semibold transition-colors flex items-center justify-center">
          Go to Admin Panel &rarr;
        </button>
      </div>
    </div>
  );
}
