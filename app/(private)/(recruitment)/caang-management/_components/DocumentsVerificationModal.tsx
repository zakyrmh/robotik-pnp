"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import FirebaseImage from "@/components/FirebaseImage";

interface DocumentsVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onConfirm: () => void;
  user: User | null;
  registration: Registration | null;
}

export default function DocumentsVerificationModal({
  isOpen,
  onClose,
  loading,
  onConfirm,
  user,
  registration,
}: DocumentsVerificationModalProps) {
  // Loading states for each image
  const [photoLoading, setPhotoLoading] = useState(true);
  const [ktmLoading, setKtmLoading] = useState(true);
  const [igRobotikLoading, setIgRobotikLoading] = useState(true);
  const [igMrcLoading, setIgMrcLoading] = useState(true);
  const [youtubeLoading, setYoutubeLoading] = useState(true);

  if (!user || !registration) return null;

  const formatDate = (
    timestamp:
      | { toDate: () => Date }
      | Date
      | string
      | number
      | null
      | undefined
  ) => {
    if (!timestamp) return "-";
    try {
      const date =
        timestamp && typeof timestamp === "object" && "toDate" in timestamp
          ? timestamp.toDate()
          : new Date(timestamp as string | number | Date);
      return format(date, "dd MMMM yyyy", { locale: id });
    } catch {
      return "-";
    }
  };

  const documents = registration.documents;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verifikasi Dokumen Caang</DialogTitle>
          <DialogDescription>
            Periksa kelengkapan dan keabsahan dokumen yang diunggah oleh{" "}
            <strong>{user.profile.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-slate-700 mb-2">
              Informasi Peserta
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">Nama:</span>{" "}
                <span className="font-medium">{user.profile.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500">NIM:</span>{" "}
                <span className="font-medium">{user.profile.nim}</span>
              </div>
            </div>
          </div>

          {/* Documents Preview */}
          <div className="space-y-4">
            {/* Foto Profil */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center justify-between">
                <span>Foto Profil</span>
                {documents?.photoUrl && (
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                )}
              </h4>
              {documents?.photoUrl ? (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden border">
                  {/* Skeleton Loading */}
                  {photoLoading && (
                    <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  <FirebaseImage
                    path={documents.photoUrl}
                    alt="Foto Profil"
                    width={192}
                    height={192}
                    className="object-cover w-full h-full"
                    onLoad={() => setPhotoLoading(false)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum diunggah</p>
              )}
            </div>

            {/* KTM */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center justify-between">
                <span>KTM (Opsional)</span>
                {documents?.ktmUrl && (
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                )}
              </h4>
              {documents?.ktmUrl ? (
                <div className="relative max-w-md h-64 rounded-lg overflow-hidden border">
                  {/* Skeleton Loading */}
                  {ktmLoading && (
                    <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  <FirebaseImage
                    path={documents.ktmUrl}
                    alt="KTM"
                    width={448}
                    height={256}
                    className="object-contain w-full h-full"
                    onLoad={() => setKtmLoading(false)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Tidak diunggah (opsional untuk mahasiswa baru)
                </p>
              )}
            </div>

            {/* Instagram Robotik */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center justify-between">
                <span>Bukti Follow Instagram Robotik</span>
                {documents?.igRobotikFollowUrl && (
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                )}
              </h4>
              {documents?.igRobotikFollowUrl ? (
                <div className="relative max-w-md h-64 rounded-lg overflow-hidden border">
                  {/* Skeleton Loading */}
                  {igRobotikLoading && (
                    <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  <FirebaseImage
                    path={documents.igRobotikFollowUrl}
                    alt="Bukti Follow IG Robotik"
                    width={448}
                    height={256}
                    className="object-contain w-full h-full"
                    onLoad={() => setIgRobotikLoading(false)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum diunggah</p>
              )}
            </div>

            {/* Instagram MRC */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center justify-between">
                <span>Bukti Follow Instagram MRC</span>
                {documents?.igMrcFollowUrl && (
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                )}
              </h4>
              {documents?.igMrcFollowUrl ? (
                <div className="relative max-w-md h-64 rounded-lg overflow-hidden border">
                  {/* Skeleton Loading */}
                  {igMrcLoading && (
                    <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  <FirebaseImage
                    path={documents.igMrcFollowUrl}
                    alt="Bukti Follow IG MRC"
                    width={448}
                    height={256}
                    className="object-contain w-full h-full"
                    onLoad={() => setIgMrcLoading(false)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum diunggah</p>
              )}
            </div>

            {/* YouTube */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center justify-between">
                <span>Bukti Subscribe YouTube Robotik</span>
                {documents?.youtubeSubscribeUrl && (
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                )}
              </h4>
              {documents?.youtubeSubscribeUrl ? (
                <div className="relative max-w-md h-64 rounded-lg overflow-hidden border">
                  {/* Skeleton Loading */}
                  {youtubeLoading && (
                    <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  <FirebaseImage
                    path={documents.youtubeSubscribeUrl}
                    alt="Bukti Subscribe YouTube"
                    width={448}
                    height={256}
                    className="object-contain w-full h-full"
                    onLoad={() => setYoutubeLoading(false)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum diunggah</p>
              )}
            </div>
          </div>

          {/* Verification Info */}
          {registration?.stepVerifications?.step2Documents?.verified && (
            <div className="bg-green-50 p-3 rounded-md text-sm text-green-800 border border-green-200">
              <p className="font-medium">
                ⚠️ Dokumen ini sudah pernah diverifikasi
              </p>
              <p className="text-xs mt-1">
                Diverifikasi pada:{" "}
                {formatDate(
                  registration.stepVerifications.step2Documents.verifiedAt
                )}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 border border-amber-200">
            <p className="font-medium">⚠️ Perhatian:</p>
            <p className="mt-1">
              Setelah dokumen diverifikasi, caang akan dapat melanjutkan ke
              tahap berikutnya (upload bukti pembayaran). Pastikan semua dokumen
              wajib sudah lengkap dan valid.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              "Verifikasi Dokumen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
