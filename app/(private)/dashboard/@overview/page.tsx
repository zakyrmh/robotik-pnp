export default function OverviewPage() {
  return (
    <div className="h-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Overview</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          General
        </span>
      </div>
      <p className="text-gray-600">
        Selamat datang di Sistem Informasi Robotik PNP. Ini adalah panel
        ikhtisar umum yang dapat dilihat oleh semua anggota yang login.
      </p>
      {/* Placeholder Widget */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">Total Kegiatan</p>
          <p className="text-2xl font-bold text-gray-900">12</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">Status Akun</p>
          <p className="text-2xl font-bold text-green-600">Aktif</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">Pengumuman Baru</p>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
      </div>
    </div>
  );
}
