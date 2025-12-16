import { CircleCheck, Lightbulb } from "lucide-react";

export default function ImportantInformation() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center dark:text-gray-100">
        <Lightbulb className="mr-2" />
        Tips Melengkapi Pendaftaran
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
          <CircleCheck className="text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 dark:text-gray-200">
              Siapkan Dokumen
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pas Foto 3x4, bukti follow sosmed dalam format JPG/PNG (max 2MB)
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
          <CircleCheck className="text-green-600 dark:text-green-400" />
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 dark:text-gray-200">
              Data yang Akurat
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pastikan semua informasi yang diisi benar dan sesuai
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
          <CircleCheck className="text-purple-600 dark:text-purple-400" />
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 dark:text-gray-200">
              Simpan Bukti Transfer
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Screenshot atau foto bukti pembayaran yang jelas
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
          <CircleCheck className="text-yellow-600 dark:text-yellow-400" />
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 dark:text-gray-200">
              Segera Lengkapi
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Jangan menunda, slot terbatas dan first come first served
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
