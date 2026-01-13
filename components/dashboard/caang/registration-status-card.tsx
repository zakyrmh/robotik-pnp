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
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RegistrationStatusCard() {
  const steps = [
    {
      id: "personal_data",
      label: "Data Diri",
      description: "Informasi pribadi & akademik",
      icon: User,
      status: "completed", // completed, current, pending, rejected
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
      description: "Validasi data oleh panitia",
      icon: ShieldAlert,
      status: "waiting",
    },
  ];

  return (
    <Card className="h-full border-none shadow-lg flex flex-col bg-linear-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Status Pendaftaran
          </CardTitle>
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
          >
            Menunggu Verifikasi
          </Badge>
        </div>
        <CardDescription>
          Proses pendaftaran Anda sedang berlangsung.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-4">
        <div className="space-y-6 relative">
          {/* Connecting Line */}
          <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />

          {steps.map((step) => {
            const isCompleted = step.status === "completed";
            const isWaiting = step.status === "waiting";
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isWaiting &&
                      "bg-yellow-100 border-yellow-300 text-yellow-600 animate-pulse",
                    !isCompleted &&
                      !isWaiting &&
                      "bg-slate-100 border-slate-200 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1 pt-1">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-none",
                      isCompleted
                        ? "text-green-700 dark:text-green-400"
                        : isWaiting
                        ? "text-yellow-700 dark:text-yellow-400"
                        : "text-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {isWaiting && (
                  <div className="animate-spin text-yellow-600">
                    <Clock className="w-4 h-4 ml-auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="w-full rounded-lg bg-blue-100 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Info Penting</p>
              <p className="opacity-90 leading-relaxed">
                Pastikan nomor HP/WA yang Anda daftarkan aktif. Admin akan
                menghubungi jika ada perbaikan data yang diperlukan.
              </p>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
