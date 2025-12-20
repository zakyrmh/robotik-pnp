"use client";

import {
  ArrowRight,
  UserPen,
  Lock,
  FileUp,
  Banknote,
  Hourglass,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { RegistrationStatus } from "@/types/enum";
import { Registration } from "@/types/registrations";
import { useState } from "react";
import { submitRegistration } from "@/lib/firebase/services/registration-service";

import { toast } from "sonner";

interface StepRegistrationProps {
  registration: Registration | null;
}

export default function StepRegistration({
  registration,
}: StepRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResume, setShowResume] = useState(false);

  // Status Checks
  const status = registration?.status;

  // Step 1: Data Diri
  // Done if registration exists and status is not DRAFT (implies saved)
  // If no registration, it's definitely not done.
  const isStep1Done = !!registration && status !== RegistrationStatus.DRAFT;

  // Step 2: Dokumen
  // Done if all documents are marked uploaded
  const isStep2Done = registration?.documents?.allUploaded ?? false;

  // Step 3: Bayar & Bukti
  // Done if proofUrl exists
  const isStep3Done = !!registration?.payment?.proofUrl;

  // Step 4: Final Submission Status
  // "Submitted" status or Verified/Rejected means current status is beyond Step 4 (or Step 4 is done)
  // We added SUBMITTED to enum.
  const isSubmitted =
    status === RegistrationStatus.SUBMITTED ||
    status === RegistrationStatus.VERIFIED;

  const isVerified = status === RegistrationStatus.VERIFIED;
  const isRejected = status === RegistrationStatus.REJECTED;

  // Progress Calculation
  let progress = 0;
  if (isStep1Done) progress++;
  if (isStep2Done) progress++;
  if (isStep3Done) progress++;
  if (isSubmitted) progress++;

  const percentage = (progress / 4) * 100;

  const handleSubmit = async () => {
    if (!registration) return;
    try {
      setIsSubmitting(true);
      await submitRegistration(registration.id);
      setShowResume(false);
      toast.success("Pendaftaran berhasil disubmit", {
        duration: 2000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error submitting registration:", error);
      toast.error("Gagal mengirim pendaftaran. Silakan coba lagi.", {
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 relative">
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

        {isRejected && (
          <div className="mb-6 space-y-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pendaftaran Dikembalikan</AlertTitle>
              <AlertDescription>
                Mohon perbaiki data berikut dan kirim ulang pendaftaran Anda:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {registration?.verification?.rejectionReason && (
                    <li>
                      <strong>Data Diri:</strong>{" "}
                      {registration.verification.rejectionReason}
                    </li>
                  )}
                  {registration?.documents?.rejectionReason && (
                    <li>
                      <strong>Dokumen:</strong>{" "}
                      {registration.documents.rejectionReason}
                    </li>
                  )}
                  {registration?.payment?.rejectionReason && (
                    <li>
                      <strong>Pembayaran:</strong>{" "}
                      {registration.payment.rejectionReason}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* STEP 1: DATA DIRI */}
          <div
            className={`relative rounded-2xl p-6 shadow-lg transition-all ${
              isStep1Done
                ? "bg-green-600 text-white"
                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
            }`}
          >
            <div className="absolute top-4 right-4">
              {isStep1Done ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                  PENDING
                </span>
              )}
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <UserPen />
            </div>
            <h4 className="font-bold text-lg mb-2">Lengkapi Data Diri</h4>
            <p className="text-sm mb-4 text-blue-100">
              {isStep1Done
                ? "Data diri telah disimpan"
                : "Isi formulir dengan data pribadi dan akademik Anda"}
            </p>

            {/* Always unlocked for editing unless submitted (Final Locked) */}
            {!isSubmitted ? (
              <Link
                href="/dashboard/fill-data"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition ${
                  isStep1Done
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                <span>{isStep1Done ? "Edit Data" : "Mulai Sekarang"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full bg-white/20 py-3 rounded-xl font-bold">
                <span>Terkunci</span>
              </div>
            )}
          </div>

          {/* STEP 2: UPLOAD DOKUMEN */}
          <div
            className={`relative rounded-2xl p-6 transition-all ${
              !isStep1Done
                ? "bg-gray-100 text-gray-400 opacity-60 dark:bg-gray-700/50 dark:text-gray-500"
                : isStep2Done
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-white border-2 border-blue-500 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-blue-400 shadow-md"
            }`}
          >
            <div className="absolute top-4 right-4">
              {isStep2Done ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : !isStep1Done ? (
                <Lock className="w-6 h-6" />
              ) : (
                <Hourglass className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                isStep1Done && !isStep2Done
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <FileUp />
            </div>
            <h4 className="font-bold text-lg mb-2">Upload Dokumen</h4>
            <p className="text-sm mb-4">
              {isStep2Done
                ? "Dokumen lengkap"
                : "Unggah foto dan dokumen pendukung"}
            </p>

            {isStep1Done && !isSubmitted ? (
              <Link href="/dashboard/upload-documents">
                <button
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    isStep2Done
                      ? "bg-green-200 text-green-800 hover:bg-green-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isStep2Done ? "Edit Dokumen" : "Upload Sekarang"}
                </button>
              </Link>
            ) : (
              <button
                className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                disabled
              >
                {isSubmitted ? "Terkunci" : "Terkunci"}
              </button>
            )}
          </div>

          {/* STEP 3: BAYAR */}
          <div
            className={`relative rounded-2xl p-6 transition-all ${
              !isStep2Done
                ? "bg-gray-100 text-gray-400 opacity-60 dark:bg-gray-700/50 dark:text-gray-500"
                : isStep3Done
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-white border-2 border-blue-500 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-blue-400 shadow-md"
            }`}
          >
            <div className="absolute top-4 right-4">
              {isStep3Done ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : !isStep2Done ? (
                <Lock className="w-6 h-6" />
              ) : (
                <Hourglass className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                isStep2Done && !isStep3Done
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <Banknote />
            </div>
            <h4 className="font-bold text-lg mb-2">Bayar & Bukti</h4>
            <p className="text-sm mb-4">
              {isStep3Done
                ? "Bukti pembayaran terupload"
                : "Transfer dan upload bukti"}
            </p>
            {isStep2Done && !isSubmitted ? (
              <Link href="/dashboard/payment">
                <button
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    isStep3Done
                      ? "bg-green-200 text-green-800 hover:bg-green-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isStep3Done ? "Edit/Bayar" : "Bayar Sekarang"}
                </button>
              </Link>
            ) : (
              <button
                className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                disabled
              >
                {isSubmitted ? "Terkunci" : "Terkunci"}
              </button>
            )}
          </div>

          {/* STEP 4: VERIFIKASI FINAL */}
          <div
            className={`relative rounded-2xl p-6 transition-all ${
              isSubmitted
                ? isVerified
                  ? "bg-green-600 text-white"
                  : isRejected
                  ? "bg-red-100 border-2 border-red-500 text-red-800"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
                : isStep3Done
                ? "bg-white border-2 border-blue-500 text-gray-800 shadow-md"
                : "bg-gray-100 text-gray-400 opacity-60"
            }`}
          >
            <div className="absolute top-4 right-4">
              {isVerified ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isRejected ? (
                <XCircle className="w-6 h-6" />
              ) : isSubmitted ? (
                <Hourglass className="w-6 h-6 animate-pulse" />
              ) : !isStep3Done ? (
                <Lock className="w-6 h-6" />
              ) : (
                <Send className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                isSubmitted
                  ? "bg-white/20 backdrop-blur-sm"
                  : isStep3Done
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200"
              }`}
            >
              <FileText />
            </div>
            <h4 className="font-bold text-lg mb-2">Verifikasi</h4>
            <p className="text-sm mb-4">
              {isVerified
                ? "Pendaftaran Diterima!"
                : isRejected
                ? "Pendaftaran Ditolak."
                : isSubmitted
                ? "Menunggu verifikasi admin"
                : "Cek kembali dan kirim"}
            </p>

            {isStep3Done && !isSubmitted ? (
              <button
                onClick={() => setShowResume(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Verifikasi & Kirim
              </button>
            ) : (
              <button
                className={`w-full py-3 rounded-xl font-bold cursor-default ${
                  isSubmitted ? "bg-white/20" : "bg-gray-200 text-gray-500"
                }`}
                disabled
              >
                {isVerified ? "Selesai" : isSubmitted ? "Menunggu" : "Terkunci"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      {showResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4 dark:text-white">
                Konfirmasi Pendaftaran
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Pastikan seluruh data yang Anda masukkan sudah benar. Setelah
                dikirim, data tidak dapat diubah lagi sampai admin melakukan
                verifikasi.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                  <CheckCircle2 className="text-green-600" />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">
                      Data Diri
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Telah terisi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                  <CheckCircle2 className="text-green-600" />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">
                      Dokumen
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Semua dokumen terupload
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                  <CheckCircle2 className="text-green-600" />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">
                      Pembayaran
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bukti pembayaran terupload
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowResume(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
