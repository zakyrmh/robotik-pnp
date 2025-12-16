import {
  ArrowRight,
  UserPen,
  Lock,
  FileUp,
  Banknote,
  Hourglass,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { RegistrationStatus } from "@/types/enum";
import { Registration } from "@/types/registrations";

interface StepRegistrationProps {
  registration: Registration | null;
}

export default function StepRegistration({
  registration,
}: StepRegistrationProps) {
  // Extract verification data
  const step1Verified =
    registration?.stepVerifications?.step1FormData?.verified ?? false;
  const step2Verified =
    registration?.stepVerifications?.step2Documents?.verified ?? false;
  const step3Verified =
    registration?.stepVerifications?.step3Payment?.verified ?? false;

  const step1Rejected =
    registration?.stepVerifications?.step1FormData?.rejectionReason;
  const step2Rejected =
    registration?.stepVerifications?.step2Documents?.rejectionReason;
  const step3Rejected =
    registration?.stepVerifications?.step3Payment?.rejectionReason;

  const status = registration?.status;
  const isFormSubmitted = status && status !== RegistrationStatus.DRAFT;
  const isDocsUploaded = registration?.documents?.allUploaded ?? false;
  const isPaymentUploaded = !!registration?.payment?.proofUrl;
  const isFullyVerified = status === RegistrationStatus.VERIFIED;

  // Calculate Progress (0-4: completed steps)
  let progress = 0;
  if (isFormSubmitted) progress++;
  if (step1Verified) progress++;
  if (isDocsUploaded && step2Verified) progress++;
  if (isPaymentUploaded && step3Verified) progress++;

  const percentage = (progress / 4) * 100;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4 dark:text-gray-100">
        Langkah Pendaftaran
      </h3>
      <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Progress Keseluruhan
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {progress} dari 4 tahapan
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden dark:bg-gray-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* STEP 1: DATA DIRI */}
          <div
            className={`relative rounded-2xl p-6 shadow-lg transition-all ${
              step1Rejected
                ? "bg-red-100 border-2 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600"
                : step1Verified
                ? "bg-green-600 text-white"
                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
            }`}
          >
            <div className="absolute top-4 right-4">
              {step1Verified ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : step1Rejected ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                  {isFormSubmitted ? "MENUNGGU VERIFIKASI" : "AKTIF"}
                </span>
              )}
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <UserPen />
            </div>
            <h4 className="font-bold text-lg mb-2">Lengkapi Data Diri</h4>
            <p
              className={`text-sm mb-4 ${
                step1Rejected
                  ? "text-red-700 dark:text-red-200"
                  : "text-blue-100"
              }`}
            >
              {step1Verified
                ? "Data diri telah diverifikasi"
                : step1Rejected
                ? `Ditolak: ${step1Rejected}`
                : "Isi formulir dengan data pribadi dan akademik Anda"}
            </p>
            {step1Verified ? (
              <div className="flex items-center justify-center gap-2 w-full bg-white/20 py-3 rounded-xl font-bold">
                <span>Selesai</span>
              </div>
            ) : (
              <Link
                href="/dashboard/fill-data"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition ${
                  step1Rejected
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-gray-800"
                }`}
              >
                <span>{isFormSubmitted ? "Edit Data" : "Mulai Sekarang"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* STEP 2: UPLOAD DOKUMEN */}
          <div
            className={`relative rounded-2xl p-6 transition-all ${
              step2Rejected
                ? "bg-red-100 border-2 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600 shadow-md"
                : step1Verified && !step2Verified
                ? "bg-white border-2 border-blue-500 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-blue-400 shadow-md"
                : step2Verified
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-400 opacity-60 dark:bg-gray-700/50 dark:text-gray-500"
            }`}
          >
            <div className="absolute top-4 right-4">
              {step2Verified ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : step2Rejected ? (
                <XCircle className="w-6 h-6" />
              ) : !step1Verified ? (
                <Lock className="w-6 h-6" />
              ) : isDocsUploaded ? (
                <Hourglass className="w-6 h-6 animate-pulse" />
              ) : null}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                step1Verified && !step2Verified
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <FileUp />
            </div>
            <h4 className="font-bold text-lg mb-2">Upload Dokumen</h4>
            <p className="text-sm mb-4">
              {step2Verified
                ? "Dokumen telah diunggah dan diverifikasi"
                : step2Rejected
                ? `Ditolak: ${step2Rejected}`
                : isDocsUploaded
                ? "Menunggu verifikasi admin"
                : "Unggah foto dan dokumen lainnya"}
            </p>

            {step1Verified && !step2Verified && !isDocsUploaded ? (
              <Link href="/dashboard/upload-documents">
                <button
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    step2Rejected
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {step2Rejected ? "Upload Ulang" : "Upload Sekarang"}
                </button>
              </Link>
            ) : (
              <button
                className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                disabled
              >
                {step2Verified
                  ? "Selesai"
                  : isDocsUploaded
                  ? "Menunggu Verifikasi"
                  : "Terkunci"}
              </button>
            )}
          </div>

          {/* STEP 3: BAYAR */}
          <div
            className={`relative rounded-2xl p-6 transition-all ${
              step3Rejected
                ? "bg-red-100 border-2 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600 shadow-md"
                : step2Verified && !step3Verified
                ? "bg-white border-2 border-blue-500 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-blue-400 shadow-md"
                : step3Verified
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-400 opacity-60 dark:bg-gray-700/50 dark:text-gray-500"
            }`}
          >
            <div className="absolute top-4 right-4">
              {step3Verified ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : step3Rejected ? (
                <XCircle className="w-6 h-6" />
              ) : !step2Verified ? (
                <Lock className="w-6 h-6" />
              ) : isPaymentUploaded ? (
                <Hourglass className="w-6 h-6 animate-pulse" />
              ) : null}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                step2Verified && !step3Verified
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <Banknote />
            </div>
            <h4 className="font-bold text-lg mb-2">Bayar & Bukti</h4>
            <p className="text-sm mb-4">
              {step3Verified
                ? "Pembayaran telah diverifikasi"
                : step3Rejected
                ? `Ditolak: ${step3Rejected}`
                : isPaymentUploaded
                ? "Menunggu verifikasi admin"
                : "Transfer Rp 10.000 dan upload bukti"}
            </p>
            {step2Verified && !step3Verified && !isPaymentUploaded ? (
              <Link href="/dashboard/payment">
                <button
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    step3Rejected
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {step3Rejected ? "Upload Ulang" : "Bayar Sekarang"}
                </button>
              </Link>
            ) : (
              <button
                className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                disabled
              >
                {step3Verified
                  ? "Selesai"
                  : isPaymentUploaded
                  ? "Menunggu Verifikasi"
                  : "Terkunci"}
              </button>
            )}
          </div>

          {/* STEP 4: VERIFIKASI FINAL */}
          <div
            className={`relative rounded-2xl p-6 transition-all ${
              isFullyVerified
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : step3Verified
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200"
                : "bg-gray-100 text-gray-400 opacity-60 dark:bg-gray-700/50 dark:text-gray-500"
            }`}
          >
            <div className="absolute top-4 right-4">
              {isFullyVerified ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : !step3Verified ? (
                <Lock className="w-6 h-6" />
              ) : (
                <Hourglass className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                step3Verified && !isFullyVerified
                  ? "bg-yellow-200 text-yellow-700"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <Hourglass />
            </div>
            <h4 className="font-bold text-lg mb-2">Verifikasi</h4>
            <p className="text-sm mb-4">
              {isFullyVerified
                ? "Pendaftaran Diterima"
                : "Admin memverifikasi semua data"}
            </p>
            <button
              className="w-full bg-transparent border border-current py-3 rounded-xl font-bold opacity-50 cursor-default"
              disabled
            >
              {isFullyVerified
                ? "Verified"
                : step3Verified
                ? "Menunggu"
                : "Terkunci"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
