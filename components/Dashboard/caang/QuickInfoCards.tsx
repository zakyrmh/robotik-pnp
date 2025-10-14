import { Banknote, Calendar, Headset, Info, Mail, Phone } from "lucide-react";

export default function QuickInfoCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Info className="text-blue-600 h-6 w-6" />
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            PENTING
          </span>
        </div>
        <h3 className="font-bold text-gray-800 mb-2">
          Batas Waktu Pendaftaran
        </h3>
        <p className="text-gray-600 text-sm mb-3">
          Lengkapi seluruh data sebelum:
        </p>
        <div className="flex items-center space-x-2 text-lg font-bold text-blue-600">
          <Calendar className="text-blue-600 h-6 w-6" />
          <span>20 September 2025</span>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">
            Sisa waktu:{" "}
            <span className="font-semibold text-red-600">9 hari lagi</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Banknote className="text-green-600 h-6 w-6" />
          </div>
        </div>
        <h3 className="font-bold text-gray-800 mb-2">Biaya Pendaftaran</h3>
        <p className="text-gray-600 text-sm mb-3">Total yang harus dibayar:</p>
        <div className="text-3xl font-bold text-green-600 mb-2">Rp 10.000</div>
        <p className="text-xs text-gray-500">
          Transfer ke rekening yang akan diberikan di langkah berikutnya
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Headset className="text-purple-600 h-6 w-6" />
          </div>
        </div>
        <h3 className="font-bold text-gray-800 mb-2">Butuh Bantuan?</h3>
        <p className="text-gray-600 text-sm mb-3">
          Hubungi admin jika ada kendala:
        </p>
        <div className="space-y-2">
          <a
            href="#"
            className="flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            <Phone className="mr-2 h-4 w-4" />
            +62 851-5787-5233
          </a>
          <a
            href="#"
            className="flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            <Mail className="mr-2 h-4 w-4" />
            infokomrobotikpnp2024@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
