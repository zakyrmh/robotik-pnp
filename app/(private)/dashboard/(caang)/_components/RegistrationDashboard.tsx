import React from "react";
import StatusCardRegist from "@/components/Dashboard/caang/StatusCardRegist";
import StepRegistration from "@/app/(private)/dashboard/(caang)/_components/_components/StepRegistration";
import QuickInfoCard from "@/components/Dashboard/caang/QuickInfoCards";
import ImportantInformation from "@/components/Dashboard/caang/ImportantInformation";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { RegistrationStatus } from "@/types/enum";

interface RegistrationDashboardProps {
  user: User | null;
  caang: Registration | null;
}

export default function RegistrationDashboard({
  user,
  caang,
}: RegistrationDashboardProps) {
  const status = caang?.status;
  const payment = caang?.payment;
  const verification = caang?.verification;

  const isPaymentRejected =
    payment?.verified === false && Boolean(payment?.rejectionReason);
  const isVerificationRejected =
    verification?.verified === false && Boolean(verification?.rejectionReason);
  const isStatusRejected = status === RegistrationStatus.REJECTED;
  const isRejected =
    isPaymentRejected || isVerificationRejected || isStatusRejected;

  return (
    <div className="min-h-screen lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <StatusCardRegist user={user} />

          {/* Alert Rejection */}
          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 relative overflow-hidden dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start gap-4 z-10 relative">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-red-900/30 dark:text-red-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-1 dark:text-red-300">
                    Perlu Perbaikan Data
                  </h3>
                  <p className="text-red-600 mb-4 dark:text-red-200">
                    Terdapat data yang perlu Anda perbaiki sebelum dapat
                    melanjutkan.
                  </p>

                  <div className="space-y-2">
                    {isStatusRejected && (
                      <div className="bg-white/60 p-3 rounded-lg dark:bg-red-950/30">
                        <span className="font-semibold text-red-700 block text-sm dark:text-red-300">
                          Status Pendaftaran:
                        </span>
                        <p className="text-red-600 text-sm dark:text-red-200">
                          {verification?.rejectionReason ||
                            "Pendaftaran ditolak, silakan cek data Anda."}
                        </p>
                      </div>
                    )}

                    {isPaymentRejected && (
                      <div className="bg-white/60 p-3 rounded-lg dark:bg-red-950/30">
                        <span className="font-semibold text-red-700 block text-sm dark:text-red-300">
                          Pembayaran Ditolak:
                        </span>
                        <p className="text-red-600 text-sm dark:text-red-200">
                          {payment?.rejectionReason ||
                            "Bukti pembayaran tidak valid."}
                        </p>
                      </div>
                    )}

                    {isVerificationRejected && !isStatusRejected && (
                      <div className="bg-white/60 p-3 rounded-lg dark:bg-red-950/30">
                        <span className="font-semibold text-red-700 block text-sm dark:text-red-300">
                          Verifikasi Ditolak:
                        </span>
                        <p className="text-red-600 text-sm dark:text-red-200">
                          {verification?.rejectionReason ||
                            "Data verifikasi tidak valid."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <StepRegistration registration={caang} />
          <QuickInfoCard />
          <ImportantInformation />
        </div>
      </div>
    </div>
  );
}
