"use client";

import { useState } from "react";
import {
  Loader2,
  ChevronLeft,
  Send,
  CheckCircle2,
  User,
  FileText,
  CreditCard,
  AlertTriangle,
  Clock,
  PartyPopper,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRegistrationForm } from "./registration-form-context";
import { cn } from "@/lib/utils";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Safely format a date value that could be Firebase Timestamp, Date, or string
 */
function formatSubmittedDate(value: unknown): string {
  if (!value) return "-";

  let date: Date;

  // Check if it's a Firebase Timestamp (has toDate method)
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string") {
    date = new Date(value);
  } else {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =========================================================
// COMPONENT
// =========================================================

export function StepVerification() {
  const {
    submitForVerification,
    isSaving,
    registration,
    setCurrentStep,
    isStepCompleted,
  } = useRegistrationForm();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const status = registration?.status;
  const isSubmitted = status === "submitted";
  const isVerified = status === "verified";
  const isRejected = status === "rejected";

  // Check all steps completed
  const allStepsCompleted =
    isStepCompleted(1) && isStepCompleted(2) && isStepCompleted(3);

  const handleSubmit = async () => {
    try {
      await submitForVerification();
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Error submitting verification:", error);
    }
  };

  // Summary items
  const summaryItems = [
    {
      id: 1,
      label: "Data Diri",
      icon: User,
      completed: isStepCompleted(1),
    },
    {
      id: 2,
      label: "Dokumen Persyaratan",
      icon: FileText,
      completed: isStepCompleted(2),
    },
    {
      id: 3,
      label: "Pembayaran",
      icon: CreditCard,
      completed: isStepCompleted(3),
    },
  ];

  // VERIFIED STATE
  if (isVerified) {
    return (
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="bg-linear-to-br from-green-500 to-emerald-600 p-8 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Selamat!</h2>
          <p className="text-white/90">
            Pendaftaran Anda telah diterima dan diverifikasi
          </p>
        </div>
        <CardContent className="p-6">
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 dark:text-green-400">
              Status: Diterima
            </AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-500">
              Anda resmi menjadi Calon Anggota UKM Robotik PNP. Silakan pantau
              pengumuman untuk informasi kegiatan selanjutnya.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // REJECTED STATE
  if (isRejected) {
    return (
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="bg-linear-to-br from-red-500 to-rose-600 p-8 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Pendaftaran Ditolak</h2>
          <p className="text-white/90">
            Mohon maaf, pendaftaran Anda belum dapat diterima
          </p>
        </div>
        <CardContent className="p-6 space-y-4">
          {registration?.verification?.rejectionReason && (
            <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700 dark:text-red-400">
                Alasan Penolakan
              </AlertTitle>
              <AlertDescription className="text-red-600 dark:text-red-500">
                {registration.verification.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Anda dapat memperbaiki data dan mengajukan verifikasi ulang. Silakan
            periksa kembali data diri, dokumen, dan bukti pembayaran Anda.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Perbaiki Data Diri
            </Button>
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Perbaiki Dokumen
            </Button>
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              Perbaiki Pembayaran
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // SUBMITTED STATE - Waiting for Admin
  if (isSubmitted) {
    return (
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="bg-linear-to-br from-yellow-500 to-amber-600 p-8 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Menunggu Verifikasi</h2>
          <p className="text-white/90">
            Data Anda sedang dalam proses verifikasi oleh panitia
          </p>
        </div>
        <CardContent className="p-6 space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-700 dark:text-yellow-400">
              Status: Menunggu Verifikasi Admin
            </AlertTitle>
            <AlertDescription className="text-yellow-600 dark:text-yellow-500">
              Estimasi waktu verifikasi 1-3 hari kerja. Kami akan menghubungi
              melalui WhatsApp jika ada informasi lebih lanjut.
            </AlertDescription>
          </Alert>

          {/* Summary */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Data yang diajukan:
            </p>
            <div className="space-y-2">
              {summaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Diajukan pada: {formatSubmittedDate(registration?.submittedAt)}
          </p>
        </CardContent>
      </Card>
    );
  }

  // DEFAULT STATE - Ready to Submit
  // Check if this is a revision request (has rejection reason but not rejected status)
  const isRevisionRequest =
    registration?.verification?.rejectionReason && !isRejected;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Verifikasi Pendaftaran</CardTitle>
        <CardDescription>
          Periksa kembali data Anda sebelum mengirim untuk diverifikasi oleh
          panitia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revision Notice */}
        {isRevisionRequest && (
          <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">
              Perlu Revisi
            </AlertTitle>
            <AlertDescription className="text-amber-600 dark:text-amber-500">
              <p className="mb-2">
                Admin meminta Anda untuk memperbaiki data pendaftaran:
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  &ldquo;{registration?.verification?.rejectionReason}&rdquo;
                </p>
              </div>
              <p className="mt-2 text-sm">
                Silakan perbaiki data yang diminta, lalu ajukan verifikasi
                ulang.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Ringkasan Data:</p>
          {summaryItems.map((item) => {
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  item.completed
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    item.completed
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white",
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.completed ? "Lengkap" : "Belum lengkap"}
                  </p>
                </div>
                {!item.completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(item.id as 1 | 2 | 3)}
                  >
                    Lengkapi
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Warning */}
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">
            Perhatian
          </AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-500">
            Setelah mengajukan verifikasi, Anda <strong>tidak dapat</strong>{" "}
            mengubah data lagi. Pastikan semua informasi sudah benar sebelum
            melanjutkan.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(3)}
          disabled={isSaving}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogTrigger asChild>
            <Button size="lg" disabled={!allStepsCompleted || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Ajukan Verifikasi
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Pengajuan Verifikasi</DialogTitle>
              <DialogDescription>
                Anda yakin ingin mengajukan data untuk diverifikasi? Setelah
                diajukan, data tidak dapat diubah lagi.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="confirm"
                  checked={confirmChecked}
                  onCheckedChange={(checked) =>
                    setConfirmChecked(checked as boolean)
                  }
                />
                <Label
                  htmlFor="confirm"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Saya menyatakan bahwa semua data yang saya isi adalah benar
                  dan dapat dipertanggungjawabkan. Saya memahami bahwa data
                  tidak dapat diubah setelah pengajuan.
                </Label>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!confirmChecked || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ya, Ajukan Verifikasi
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
