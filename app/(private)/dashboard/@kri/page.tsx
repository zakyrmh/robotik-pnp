export default function KriDashboardPage() {
  return (
    <div className="h-full bg-white p-6 rounded-xl border border-orange-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <h1 className="text-9xl font-black text-orange-500 transform rotate-12">
          KRI
        </h1>
      </div>
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-8 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">
            Kontes Robot Indonesia
          </h2>
        </div>
        <p className="text-gray-600 mb-4">
          Panel khusus untuk anggota tim KRI (KRAI, KRSBI, KRSTI, KRSRI).
        </p>
        <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium">
          Lihat Jadwal Latihan
        </button>
      </div>
    </div>
  );
}
