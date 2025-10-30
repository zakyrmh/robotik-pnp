import { ArrowRight, UserPen, Lock, FileUp, Banknote, Hourglass } from "lucide-react";

export default function StepRegistration() {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Langkah Pendaftaran
      </h3>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Progress Keseluruhan
            </span>
            <span className="text-sm font-bold text-blue-600">
              0 dari 4 langkah
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: '0%' }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                AKTIF
              </span>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <UserPen />
            </div>
            <h4 className="font-bold text-lg mb-2">Lengkapi Data Diri</h4>
            <p className="text-blue-100 text-sm mb-4">
              Isi formulir dengan data pribadi dan akademik Anda
            </p>
            <button className="flex items-center justify-center gap-2 w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition">
              <span>Mulai Sekarang</span><ArrowRight />
            </button>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-blue-100">Estimasi: 10 menit</p>
            </div>
          </div>

          <div className="relative bg-gray-100 rounded-2xl p-6 text-gray-400 opacity-60">
            <div className="absolute top-4 right-4">
              <Lock />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
              <FileUp />
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-600">
              Upload Dokumen
            </h4>
            <p className="text-gray-500 text-sm mb-4">
              Unggah foto dan dokumen lainnya
            </p>
            <button
              className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed"
              disabled
            >
              Terkunci
            </button>
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-500">Estimasi: 5 menit</p>
            </div>
          </div>

          <div className="relative bg-gray-100 rounded-2xl p-6 text-gray-400 opacity-60">
            <div className="absolute top-4 right-4">
              <Lock />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
              <Banknote />
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-600">
              Bayar & Upload Bukti
            </h4>
            <p className="text-gray-500 text-sm mb-4">
              Transfer Rp 10.000 dan upload bukti pembayaran
            </p>
            <button
              className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed"
              disabled
            >
              Terkunci
            </button>
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-500">Estimasi: 5 menit</p>
            </div>
          </div>

          <div className="relative bg-gray-100 rounded-2xl p-6 text-gray-400 opacity-60">
            <div className="absolute top-4 right-4">
              <Lock />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
              <Hourglass />
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-600">
              Menunggu Verifikasi
            </h4>
            <p className="text-gray-500 text-sm mb-4">
              Admin akan memverifikasi data Anda
            </p>
            <button
              className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed"
              disabled
            >
              Terkunci
            </button>
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-500">Estimasi: 1-2 hari</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
