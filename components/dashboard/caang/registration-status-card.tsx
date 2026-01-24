"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  FileText,
  User,
  CreditCard,
  AlertCircle,
  ShieldAlert,
  XCircle,
  Lock,
  Loader2,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Registration,
  RegistrationStatus,
  RegistrationProgress,
} from "@/schemas/registrations";

// =========================================================
// TYPES
// =========================================================

type StepStatus = "completed" | "current" | "pending" | "locked" | "rejected";

interface RegistrationStep {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status: StepStatus;
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Determine steps status based on registration data
 */
function calculateSteps(
  registration: Registration | null,
  progress: RegistrationProgress | null,
): RegistrationStep[] {
  // Default: no registration data yet
  if (!registration) {
    return [
      {
        id: "personal_data",
        label: "Data Diri",
        description: "Informasi pribadi & akademik",
        icon: User,
        status: "current",
      },
      {
        id: "documents",
        label: "Dokumen",
        description: "Berkas persyaratan",
        icon: FileText,
        status: "locked",
      },
      {
        id: "payment",
        label: "Pembayaran",
        description: "Bukti pembayaran pendaftaran",
        icon: CreditCard,
        status: "locked",
      },
      {
        id: "verification",
        label: "Verifikasi Admin",
        description: "Validasi data oleh panitia",
        icon: ShieldAlert,
        status: "locked",
      },
    ];
  }

  const status = registration.status;

  // Rejected status
  if (status === "rejected") {
    return [
      {
        id: "personal_data",
        label: "Data Diri",
        description: "Perlu diperbaiki",
        icon: User,
        status: progress?.personalDataCompleted ? "completed" : "current",
      },
      {
        id: "documents",
        label: "Dokumen",
        description: "Perlu diperbaiki",
        icon: FileText,
        status: progress?.documentsUploaded ? "completed" : "pending",
      },
      {
        id: "payment",
        label: "Pembayaran",
        description: "Perlu diperbaiki",
        icon: CreditCard,
        status: progress?.paymentUploaded ? "completed" : "pending",
      },
      {
        id: "verification",
        label: "Verifikasi Admin",
        description: "Ditolak - silakan perbaiki data",
        icon: ShieldAlert,
        status: "rejected",
      },
    ];
  }

  // Verified status
  if (status === "verified") {
    return [
      {
        id: "personal_data",
        label: "Data Diri",
        description: "Informasi pribadi & akademik",
        icon: User,
        status: "completed",
      },
      {
        id: "documents",
        label: "Dokumen",
        description: "Berkas persyaratan",
        icon: FileText,
        status: "completed",
      },
      {
        id: "payment",
        label: "Pembayaran",
        description: "Bukti pembayaran pendaftaran",
        icon: CreditCard,
        status: "completed",
      },
      {
        id: "verification",
        label: "Verifikasi Admin",
        description: "Pendaftaran diterima",
        icon: ShieldAlert,
        status: "completed",
      },
    ];
  }

  // Submitted status - waiting for admin
  if (status === "submitted") {
    return [
      {
        id: "personal_data",
        label: "Data Diri",
        description: "Informasi pribadi & akademik",
        icon: User,
        status: "completed",
      },
      {
        id: "documents",
        label: "Dokumen",
        description: "Berkas persyaratan",
        icon: FileText,
        status: "completed",
      },
      {
        id: "payment",
        label: "Pembayaran",
        description: "Bukti pembayaran pendaftaran",
        icon: CreditCard,
        status: "completed",
      },
      {
        id: "verification",
        label: "Verifikasi Admin",
        description: "Menunggu validasi panitia",
        icon: ShieldAlert,
        status: "current",
      },
    ];
  }

  // Draft or in_progress - determine which step is current
  const personalDone = progress?.personalDataCompleted ?? false;
  const docsDone = progress?.documentsUploaded ?? false;
  const paymentDone = progress?.paymentUploaded ?? false;

  // Step 1: Personal Data
  let step1Status: StepStatus = "current";
  if (personalDone) step1Status = "completed";

  // Step 2: Documents
  let step2Status: StepStatus = "locked";
  if (personalDone && !docsDone) step2Status = "current";
  else if (docsDone) step2Status = "completed";

  // Step 3: Payment
  let step3Status: StepStatus = "locked";
  if (personalDone && docsDone && !paymentDone) step3Status = "current";
  else if (paymentDone) step3Status = "completed";

  // Step 4: Verification
  let step4Status: StepStatus = "locked";
  if (personalDone && docsDone && paymentDone) step4Status = "pending";

  return [
    {
      id: "personal_data",
      label: "Data Diri",
      description: "Informasi pribadi & akademik",
      icon: User,
      status: step1Status,
    },
    {
      id: "documents",
      label: "Dokumen",
      description: "Berkas persyaratan",
      icon: FileText,
      status: step2Status,
    },
    {
      id: "payment",
      label: "Pembayaran",
      description: "Bukti pembayaran pendaftaran",
      icon: CreditCard,
      status: step3Status,
    },
    {
      id: "verification",
      label: "Verifikasi Admin",
      description:
        step4Status === "pending"
          ? "Klik untuk mengirim verifikasi"
          : "Lengkapi data terlebih dahulu",
      icon: ShieldAlert,
      status: step4Status,
    },
  ];
}

/**
 * Get status badge info
 */
function getStatusBadge(status: RegistrationStatus | null): {
  label: string;
  className: string;
} {
  if (!status) {
    return {
      label: "Belum Mulai",
      className:
        "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
    };
  }

  switch (status) {
    case "draft":
    case "in_progress":
      return {
        label: "Sedang Mengisi",
        className:
          "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "submitted":
      return {
        label: "Menunggu Verifikasi",
        className:
          "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
    case "verified":
      return {
        label: "Diterima",
        className:
          "bg-green-100 text-green-700 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      };
    case "rejected":
      return {
        label: "Ditolak",
        className:
          "bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      };
    default:
      return {
        label: "Unknown",
        className: "bg-gray-100 text-gray-700",
      };
  }
}

// =========================================================
// STEP ICON COMPONENT
// =========================================================

function createShieldIcon(status: StepStatus, Icon: LucideIcon) {
  const IconComponent = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6" />;
      case "rejected":
        return <XCircle className="h-6 w-6" />;
      case "locked":
        return <Lock className="h-5 w-5" />;
      default:
        return <Icon className="h-5 w-5" />;
    }
  };
  IconComponent.displayName = `StepIcon(${status})`;
  return IconComponent;
}

// =========================================================
// COMPONENT
// =========================================================

export function RegistrationStatusCard() {
  const { user } = useDashboard();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Fetch registration data
  useEffect(() => {
    async function fetchRegistration() {
      if (!user?.uid) return;

      setIsLoading(true);

      try {
        const regRef = doc(db, "registrations", user.uid);
        const regSnap = await getDoc(regRef);

        if (regSnap.exists()) {
          const regData = { id: regSnap.id, ...regSnap.data() } as Registration;
          setRegistration(regData);

          // Get rejection reason if rejected
          if (regData.status === "rejected" && regData.verification) {
            setRejectionReason(regData.verification.rejectionReason || null);
          }
        }
      } catch (error) {
        console.error("Error fetching registration:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRegistration();
  }, [user?.uid]);

  // Calculate steps
  const steps = calculateSteps(registration, registration?.progress || null);
  const statusBadge = getStatusBadge(registration?.status || null);

  if (isLoading) {
    return (
      <Card className="h-full border-none shadow-lg flex flex-col bg-linear-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-none shadow-lg flex flex-col bg-linear-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Status Pendaftaran
          </CardTitle>
          <Badge variant="secondary" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </div>
        <CardDescription>
          {registration?.status === "verified"
            ? "Selamat! Pendaftaran Anda telah diterima."
            : registration?.status === "rejected"
              ? "Pendaftaran ditolak. Silakan perbaiki data Anda."
              : registration?.status === "submitted"
                ? "Data sedang diverifikasi oleh panitia."
                : "Proses pendaftaran Anda sedang berlangsung."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-4">
        <div className="space-y-6 relative">
          {/* Connecting Line */}
          <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />

          {steps.map((step) => {
            const IconComponent = createShieldIcon(step.status, step.icon);

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                    step.status === "completed" &&
                      "bg-green-500 border-green-500 text-white",
                    step.status === "current" &&
                      "bg-blue-100 border-blue-300 text-blue-600 animate-pulse",
                    step.status === "pending" &&
                      "bg-yellow-100 border-yellow-300 text-yellow-600",
                    step.status === "locked" &&
                      "bg-slate-100 border-slate-200 text-muted-foreground",
                    step.status === "rejected" &&
                      "bg-red-500 border-red-500 text-white",
                  )}
                >
                  <IconComponent />
                </div>
                <div className="flex-1 space-y-1 pt-1">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-none",
                      step.status === "completed" &&
                        "text-green-700 dark:text-green-400",
                      step.status === "current" &&
                        "text-blue-700 dark:text-blue-400",
                      step.status === "pending" &&
                        "text-yellow-700 dark:text-yellow-400",
                      step.status === "rejected" &&
                        "text-red-700 dark:text-red-400",
                      step.status === "locked" && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {step.status === "current" && step.id !== "verification" && (
                  <div className="animate-pulse text-blue-600">
                    <Clock className="w-4 h-4 ml-auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        {registration?.status === "rejected" && rejectionReason ? (
          <div className="w-full rounded-lg bg-red-100 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <div className="flex gap-2">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">Alasan Penolakan</p>
                <p className="opacity-90 leading-relaxed">{rejectionReason}</p>
              </div>
            </div>
          </div>
        ) : registration?.status === "verified" ? (
          <div className="w-full rounded-lg bg-green-100 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-semibold mb-1">Selamat!</p>
                <p className="opacity-90 leading-relaxed">
                  Anda resmi menjadi Calon Anggota UKM Robotik PNP. Ikuti
                  kegiatan selanjutnya sesuai jadwal.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-lg bg-blue-100 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Info Penting</p>
                <p className="opacity-90 leading-relaxed">
                  {registration?.status === "submitted"
                    ? "Data Anda sedang dalam proses verifikasi. Harap tunggu konfirmasi dari panitia."
                    : "Pastikan nomor HP/WA yang Anda daftarkan aktif. Admin akan menghubungi jika ada perbaikan data yang diperlukan."}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
