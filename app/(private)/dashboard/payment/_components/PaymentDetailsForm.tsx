import { PaymentMethod, PaymentFormState } from "@/types/registrations";

interface PaymentDetailsFormProps {
  method: PaymentMethod;
  paymentData: PaymentFormState;
  setPaymentData: React.Dispatch<React.SetStateAction<PaymentFormState>>;
}

export default function PaymentDetailsForm({
  method,
  paymentData,
  setPaymentData,
}: PaymentDetailsFormProps) {
  if (method === PaymentMethod.TRANSFER) {
    return (
      <div className="space-y-4 border-t pt-4 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Nama Bank *
          </label>
          <input
            type="text"
            value={paymentData.bankName}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                bankName: e.target.value,
              }))
            }
            placeholder="Contoh: BCA"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Nomor Rekening *
          </label>
          <input
            type="text"
            value={paymentData.accountNumber}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                accountNumber: e.target.value,
              }))
            }
            placeholder="1234567890"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Nama Pemilik Rekening *
          </label>
          <input
            type="text"
            value={paymentData.accountName}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                accountName: e.target.value,
              }))
            }
            placeholder="Nama sesuai rekening"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
      </div>
    );
  }

  if (method === PaymentMethod.E_WALLET) {
    return (
      <div className="space-y-4 border-t pt-4 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Provider E-Wallet *
          </label>
          <select
            value={paymentData.ewalletProvider}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                ewalletProvider: e.target.value,
              }))
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Pilih Provider</option>
            <option value="gopay">GoPay</option>
            <option value="ovo">OVO</option>
            <option value="dana">DANA</option>
            <option value="shopeepay">ShopeePay</option>
            <option value="linkaja">LinkAja</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Nomor E-Wallet *
          </label>
          <input
            type="text"
            value={paymentData.ewalletNumber}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                ewalletNumber: e.target.value,
              }))
            }
            placeholder="08xxxxxxxxxx"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
      </div>
    );
  }

  return null;
}
