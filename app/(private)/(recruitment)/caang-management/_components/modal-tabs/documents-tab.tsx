"use client";

import { useState } from "react";
import { CaangData } from "@/lib/firebase/services/caang-service";
import FirebaseImage from "@/components/FirebaseImage";
import {
  FileImage,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

interface DocumentsTabProps {
  caang: CaangData;
}

// Document Card Component
function DocumentCard({
  label,
  path,
  verified,
  verifiedBy,
  onView,
}: {
  label: string;
  path?: string;
  verified?: boolean;
  verifiedBy?: string;
  onView: (path: string) => void;
}) {
  const hasDocument = !!path;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        {hasDocument && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              verified
                ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400"
            }`}
          >
            {verified ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {verified ? "Verified" : "Pending"}
          </span>
        )}
      </div>

      {hasDocument ? (
        <div
          className="relative aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => onView(path)}
        >
          <FirebaseImage
            path={path}
            fallbackSrc="/images/placeholder.jpg"
            width={400}
            height={225}
            alt={label}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
              <ExternalLink className="w-4 h-4" />
              Lihat Full
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Belum diupload</p>
          </div>
        </div>
      )}

      {verified && verifiedBy && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Diverifikasi oleh: {verifiedBy}
        </p>
      )}
    </div>
  );
}

// Image Preview Modal
function ImagePreviewModal({
  isOpen,
  onClose,
  path,
}: {
  isOpen: boolean;
  onClose: () => void;
  path: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
        <FirebaseImage
          path={path}
          fallbackSrc="/images/placeholder.jpg"
          width={1200}
          height={800}
          alt="Preview"
          className="rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export function DocumentsTab({ caang }: DocumentsTabProps) {
  const { registration } = caang;
  const docs = registration?.documents;
  const payment = registration?.payment;

  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const openPreview = (path: string) => {
    setPreviewPath(path);
  };

  return (
    <div className="space-y-6">
      {/* Documents Section */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <FileImage className="w-4 h-4 text-blue-500" />
          Dokumen Pendaftaran
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DocumentCard
            label="Foto Profil"
            path={docs?.photoUrl}
            verified={docs?.verified}
            verifiedBy={docs?.verifiedBy}
            onView={openPreview}
          />
          <DocumentCard
            label="KTM"
            path={docs?.ktmUrl}
            verified={docs?.verified}
            verifiedBy={docs?.verifiedBy}
            onView={openPreview}
          />
          <DocumentCard
            label="Follow IG Robotik"
            path={docs?.igRobotikFollowUrl}
            verified={docs?.verified}
            onView={openPreview}
          />
          <DocumentCard
            label="Follow IG MRC"
            path={docs?.igMrcFollowUrl}
            verified={docs?.verified}
            onView={openPreview}
          />
          <DocumentCard
            label="Subscribe YouTube"
            path={docs?.youtubeSubscribeUrl}
            verified={docs?.verified}
            onView={openPreview}
          />
        </div>
      </div>

      {/* Payment Section */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-green-500" />
          Data Pembayaran
        </h4>

        {payment ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Metode
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {payment.method?.replace(/_/g, " ") || "-"}
                </p>
              </div>
              {payment.method === "transfer" && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Bank
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {payment.bankName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      No. Rekening
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {payment.accountNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Atas Nama
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {payment.accountName || "-"}
                    </p>
                  </div>
                </>
              )}
              {payment.method === "e_wallet" && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      E-Wallet
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {payment.ewalletProvider || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Nomor
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {payment.ewalletNumber || "-"}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    payment.verified
                      ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400"
                  }`}
                >
                  {payment.verified ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {payment.verified ? "Terverifikasi" : "Menunggu Verifikasi"}
                </span>
              </div>
            </div>

            {/* Payment Proof */}
            {payment.proofUrl && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Bukti Pembayaran
                </p>
                <div
                  className="relative w-48 aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => openPreview(payment.proofUrl!)}
                >
                  <FirebaseImage
                    path={payment.proofUrl}
                    fallbackSrc="/images/placeholder.jpg"
                    width={192}
                    height={108}
                    alt="Bukti Pembayaran"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
            <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              Belum ada data pembayaran
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewPath}
        onClose={() => setPreviewPath(null)}
        path={previewPath || ""}
      />
    </div>
  );
}
