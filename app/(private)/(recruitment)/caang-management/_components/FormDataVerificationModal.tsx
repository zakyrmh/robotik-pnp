"use client";

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

interface FormDataVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onConfirm: () => void;
  user: User | null;
  registration: Registration | null;
}

export default function FormDataVerificationModal({
  isOpen,
  onClose,
  loading,
  onConfirm,
  user,
  registration,
}: FormDataVerificationModalProps) {
  if (!user) return null;

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

  const getGenderLabel = (gender?: string) => {
    if (!gender) return "-";
    return gender === "male" ? "Laki-laki" : "Perempuan";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verifikasi Data Diri Caang</DialogTitle>
          <DialogDescription>
            Pastikan data diri berikut sudah benar sebelum melakukan verifikasi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Personal Information */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm text-slate-700 mb-3">
              Data Pribadi
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Nama Lengkap</p>
                <p className="font-medium">{user.profile.fullName || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Nama Panggilan</p>
                <p className="font-medium">{user.profile.nickname || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">NIM</p>
                <p className="font-medium">{user.profile.nim || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-sm">{user.email || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">No. Telepon</p>
                <p className="font-medium">{user.profile.phone || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Jenis Kelamin</p>
                <p className="font-medium">
                  {getGenderLabel(user.profile.gender)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Tempat Lahir</p>
                <p className="font-medium">{user.profile.birthPlace || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Tanggal Lahir</p>
                <p className="font-medium">
                  {formatDate(user.profile.birthDate)}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-slate-500">Alamat</p>
                <p className="font-medium">{user.profile.address || "-"}</p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm text-blue-700 mb-3">
              Data Akademik
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600">Jurusan</p>
                <p className="font-medium text-blue-900">
                  {user.profile.department || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-blue-600">Program Studi</p>
                <p className="font-medium text-blue-900">
                  {user.profile.major || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-blue-600">Tahun Angkatan</p>
                <p className="font-medium text-blue-900">
                  {user.profile.entryYear || "-"}
                </p>
              </div>

              {registration?.orPeriod && (
                <div>
                  <p className="text-xs text-blue-600">Periode OR</p>
                  <p className="font-medium text-blue-900">
                    {registration.orPeriod}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Verification Info */}
          {registration?.stepVerifications?.step1FormData?.verified && (
            <div className="bg-green-50 p-3 rounded-md text-sm text-green-800 border border-green-200">
              <p className="font-medium">
                ⚠️ Data ini sudah pernah diverifikasi
              </p>
              <p className="text-xs mt-1">
                Diverifikasi pada:{" "}
                {formatDate(
                  registration.stepVerifications.step1FormData.verifiedAt
                )}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 border border-amber-200">
            <p className="font-medium">⚠️ Perhatian:</p>
            <p className="mt-1">
              Setelah data diverifikasi, caang akan dapat melanjutkan ke tahap
              berikutnya (upload dokumen). Pastikan semua data sudah benar.
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
              "Verifikasi Data"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
