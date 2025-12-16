import { Banknote } from "lucide-react";

export default function PaymentInstructions() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 dark:bg-blue-900/20 dark:border-blue-800">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 dark:bg-blue-900/30 dark:text-blue-400">
          <Banknote className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-1 dark:text-blue-300">
            Informasi Pembayaran
          </h3>
          <p className="text-blue-600 mb-4 dark:text-blue-200">
            Transfer biaya pendaftaran sebesar <strong>Rp 10.000</strong> ke
            rekening berikut:
          </p>
          <div className="bg-white/60 p-4 rounded-xl dark:bg-blue-950/30">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>BCA - 1234567890</strong>
              <br />
              a.n. <strong>UKM Robotika Undip</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
