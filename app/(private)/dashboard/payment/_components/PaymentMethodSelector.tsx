import { PaymentMethod } from "@/types/enum";
import { Banknote, CreditCard, Wallet } from "lucide-react";

interface PaymentMethodSelectorProps {
  currentMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

export default function PaymentMethodSelector({
  currentMethod,
  onMethodChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <button
        type="button"
        onClick={() => onMethodChange(PaymentMethod.TRANSFER)}
        className={`p-4 rounded-xl border-2 transition ${
          currentMethod === PaymentMethod.TRANSFER
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
        }`}
      >
        <CreditCard
          className={`w-8 h-8 mx-auto mb-2 ${
            currentMethod === PaymentMethod.TRANSFER
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400"
          }`}
        />
        <p
          className={`font-medium ${
            currentMethod === PaymentMethod.TRANSFER
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          Transfer Bank
        </p>
      </button>

      <button
        type="button"
        onClick={() => onMethodChange(PaymentMethod.E_WALLET)}
        className={`p-4 rounded-xl border-2 transition ${
          currentMethod === PaymentMethod.E_WALLET
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
        }`}
      >
        <Wallet
          className={`w-8 h-8 mx-auto mb-2 ${
            currentMethod === PaymentMethod.E_WALLET
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400"
          }`}
        />
        <p
          className={`font-medium ${
            currentMethod === PaymentMethod.E_WALLET
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          E-Wallet
        </p>
      </button>

      <button
        type="button"
        onClick={() => onMethodChange(PaymentMethod.CASH)}
        className={`p-4 rounded-xl border-2 transition ${
          currentMethod === PaymentMethod.CASH
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
        }`}
      >
        <Banknote
          className={`w-8 h-8 mx-auto mb-2 ${
            currentMethod === PaymentMethod.CASH
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400"
          }`}
        />
        <p
          className={`font-medium ${
            currentMethod === PaymentMethod.CASH
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          Tunai
        </p>
      </button>
    </div>
  );
}
