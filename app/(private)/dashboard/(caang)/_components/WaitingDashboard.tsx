import React from "react";
import StatusCardRegist from "@/components/Dashboard/caang/StatusCardRegist";
import QuickInfoCard from "@/components/Dashboard/caang/QuickInfoCards";
import ImportantInformation from "@/components/Dashboard/caang/ImportantInformation";
import { User } from "@/types/users";
import { RegistrationStatus } from "@/types/enum";
import { Registration } from "@/types/registrations";

interface WaitingDashboardProps {
  user: User | null;
  caang: Registration | null;
}

export default function WaitingDashboard({
  user,
  caang,
}: WaitingDashboardProps) {
  const status = caang?.status;

  return (
    <div className="min-h-screen lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <StatusCardRegist user={user} />

          <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-blue-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-blue-900/30 dark:text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white">
              Menunggu Verifikasi
            </h2>

            {status === RegistrationStatus.FORM_SUBMITTED && (
              <p className="text-gray-600 max-w-lg mx-auto dark:text-gray-300">
                Data pendaftaran Anda telah disubmit. Tim kami sedang meninjau
                form pendaftaran Anda.
              </p>
            )}

            {(status === RegistrationStatus.DOCUMENTS_UPLOADED ||
              status === RegistrationStatus.PAYMENT_PENDING) && (
              <p className="text-gray-600 max-w-lg mx-auto dark:text-gray-300">
                Dokumen dan bukti pembayaran telah diterima. Mohon tunggu proses
                verifikasi oleh admin.
              </p>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-xl inline-block text-left dark:bg-blue-900/20">
              <h4 className="font-semibold text-blue-800 mb-2 dark:text-blue-300">
                Status Saat Ini:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 dark:text-blue-200">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Form Pendaftaran:{" "}
                  <span className="font-medium">Terkirim</span>
                </li>
                {(status === RegistrationStatus.DOCUMENTS_UPLOADED ||
                  status === RegistrationStatus.PAYMENT_PENDING) && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Dokumen & Pembayaran:{" "}
                    <span className="font-medium">Terkirim</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  Verifikasi Admin:{" "}
                  <span className="font-medium">Dalam Proses</span>
                </li>
              </ul>
            </div>
          </div>

          <QuickInfoCard />
          <ImportantInformation />
        </div>
      </div>
    </div>
  );
}
