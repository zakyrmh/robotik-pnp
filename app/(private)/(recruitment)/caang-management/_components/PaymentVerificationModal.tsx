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
import { PaymentMethod } from "@/types/enum";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import FirebaseImage from "@/components/FirebaseImage";

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onConfirm: () => void;
  user: User | null;
  registration: Registration | null;
}

export default function PaymentVerificationModal({
  isOpen,
  onClose,
  loading,
  onConfirm,
  user,
  registration,
}: PaymentVerificationModalProps) {
  // Loading state for payment proof image
  const [proofLoading, setProofLoading] = useState(true);

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
      return format(date, "dd MMMM yyyy HH:mm", { locale: id });
    } catch {
      return "-";
    }
  };

  const payment = registration.payment;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verifikasi Pembayaran Caang</DialogTitle>
          <DialogDescription>
            Periksa bukti pembayaran yang diunggah oleh{" "}
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
              <div>
                <span className="text-slate-500">Email:</span>{" "}
                <span className="font-medium text-xs">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-500">No. Telepon:</span>{" "}
                <span className="font-medium">{user.profile.phone}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-blue-700 mb-2">
              Informasi Pembayaran
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-600">Metode Pembayaran:</span>{" "}
                <span className="font-medium text-blue-900">
                  {payment?.method === PaymentMethod.TRANSFER
                    ? "Transfer Bank"
                    : payment?.method === PaymentMethod.E_WALLET
                    ? "E-Wallet"
                    : "Cash"}
                </span>
              </div>
              {payment?.proofUploadedAt && (
                <div>
                  <span className="text-blue-600">Tanggal Upload:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {formatDate(payment.proofUploadedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Proof Preview */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">Bukti Pembayaran</h4>
            {payment?.proofUrl ? (
              <div className="relative w-full max-w-lg mx-auto rounded-lg overflow-hidden border">
                {/* Skeleton Loading */}
                {proofLoading && (
                  <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-12 h-12 animate-spin text-slate-400" />
                  </div>
                )}
                <FirebaseImage
                  path={payment.proofUrl}
                  alt="Bukti Pembayaran"
                  width={600}
                  height={800}
                  className="object-contain w-full"
                  onLoad={() => setProofLoading(false)}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Belum ada bukti pembayaran yang diunggah
              </p>
            )}
          </div>

          {/* Verification Info */}
          {payment?.verified && (
            <div className="bg-green-50 p-3 rounded-md text-sm text-green-800 border border-green-200">
              <p className="font-medium">
                ✓ Pembayaran ini sudah pernah diverifikasi
              </p>
              <p className="text-xs mt-1">
                Diverifikasi pada: {formatDate(payment.verifiedAt)}
              </p>
              {payment.verifiedBy && (
                <p className="text-xs">Oleh: {payment.verifiedBy}</p>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 border border-amber-200">
            <p className="font-medium">⚠️ Perhatian:</p>
            <p className="mt-1">
              Setelah pembayaran diverifikasi, status caang akan menjadi
              &quot;Verified&quot; dan dapat mengikuti kegiatan pelatihan.
              Pastikan bukti pembayaran valid dan nominal sesuai.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || !payment?.proofUrl}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              "Verifikasi Pembayaran"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
