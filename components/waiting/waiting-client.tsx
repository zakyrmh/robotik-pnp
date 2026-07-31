"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  Cancel01Icon,
  Clock01Icon,
  ReloadIcon,
  InformationCircleIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { getRegistrationStatus } from "@/lib/actions/waiting";

interface WaitingClientProps {
  fullName: string | null;
  submittedAt: string | null;
  status: "pending" | "verified" | "rejected";
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock01Icon,
    iconClass: "text-orange-deep dark:text-pnp-orange",
    ringClass:
      "border-pnp-orange/30 bg-orange-wash/60 dark:bg-pnp-orange/15 shadow-sm",
    badgeClass:
      "bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30 font-mono text-[11px] font-semibold uppercase tracking-wider",
    label: "Menunggu Verifikasi",
    description:
      "Data pendaftaran kamu sedang ditinjau oleh pengurus UKM Robotik PNP. Proses ini biasanya memakan waktu 1–3 hari kerja.",
  },
  verified: {
    icon: CheckmarkBadge01Icon,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    ringClass:
      "border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-sm",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-semibold uppercase tracking-wider",
    label: "Pendaftaran Disetujui",
    description:
      "Selamat! Kamu resmi menjadi anggota UKM Robotik PNP. Kamu akan diarahkan ke dashboard.",
  },
  rejected: {
    icon: Cancel01Icon,
    iconClass: "text-destructive",
    ringClass:
      "border-destructive/30 bg-destructive/10 shadow-sm",
    badgeClass:
      "bg-destructive/10 text-destructive border border-destructive/30 font-mono text-[11px] font-semibold uppercase tracking-wider",
    label: "Pendaftaran Ditolak",
    description:
      "Maaf, pendaftaran kamu tidak dapat disetujui saat ini. Silakan hubungi pengurus UKM Robotik PNP untuk informasi lebih lanjut.",
  },
};

// Dots animasi untuk status pending
function PulseDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-pnp-orange"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// Progress steps — visual timeline proses pendaftaran
const TIMELINE_STEPS = [
  { label: "Form Terkirim", sublabel: "Data berhasil diterima" },
  { label: "Verifikasi Admin", sublabel: "Sedang ditinjau pengurus" },
  { label: "Hasil", sublabel: "Notifikasi dikirim" },
];

export function WaitingClient({
  fullName,
  submittedAt,
  status: initialStatus,
}: WaitingClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(false);

  const firstName = fullName?.split(" ")[0] ?? "Calon Anggota";
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  // Active step di timeline
  const activeStep = status === "pending" ? 1 : status === "verified" ? 2 : 2;

  const checkStatus = useCallback(async () => {
    setIsPolling(true);
    try {
      const result = await getRegistrationStatus();
      if (result.success && result.status) {
        setStatus(result.status);
        setLastChecked(new Date());

        if (result.status === "verified") {
          setTimeout(() => router.push("/dashboard"), 2500);
        }
      }
    } finally {
      setIsPolling(false);
    }
  }, [router]);

  // Auto-polling setiap 60 detik, hanya saat status masih pending
  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(checkStatus, 60_000);
    return () => clearInterval(interval);
  }, [status, checkStatus]);

  // Redirect otomatis jika sudah verified saat pertama render
  useEffect(() => {
    if (status === "verified") {
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  }, [status, router]);

  return (
    <div className="relative flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="relative z-10 w-full max-w-lg">
        {/* Card utama */}
        <div className="rounded-xl border border-border dark:border-white/10 bg-card text-card-foreground shadow-sm dark:shadow-none overflow-hidden transition-colors duration-200">
          {/* Top accent bar */}
          <div
            className={`h-1 w-full ${
              status === "pending"
                ? "bg-gradient-to-r from-dongker-surface via-pnp-orange to-dongker-surface"
                : status === "verified"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-destructive to-red-600"
            }`}
          />

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {/* Icon + Badge status */}
            <div className="flex flex-col items-center gap-4 text-center mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={status}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-20 h-20 rounded-full border flex items-center justify-center ${config.ringClass}`}
                >
                  <HugeiconsIcon
                    icon={StatusIcon}
                    size={38}
                    className={config.iconClass}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="space-y-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeClass}`}
                >
                  {status === "pending" && <PulseDots />}
                  {config.label}
                </span>

                <h1 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-foreground">
                  {status === "pending" && <>Hei, {firstName}! 👋</>}
                  {status === "verified" && <>Selamat, {firstName}! 🎉</>}
                  {status === "rejected" && <>Hai, {firstName}</>}
                </h1>

                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed font-sans">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Timeline steps */}
            <div className="mb-8">
              <div className="flex items-start justify-between relative">
                {/* Connector line */}
                <div className="absolute top-4 left-4 right-4 h-px bg-border" />

                {TIMELINE_STEPS.map((step, i) => {
                  const isDone = i < activeStep;
                  const isActive = i === activeStep;
                  return (
                    <div
                      key={i}
                      className="relative flex flex-col items-center gap-2 flex-1"
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isDone
                            ? status === "rejected" && i === 2
                              ? "#ef4444"
                              : "#10b981"
                            : isActive && status === "rejected"
                              ? "#ef4444"
                              : isActive
                                ? "#f97316"
                                : "var(--color-border)",
                        }}
                        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-mono shadow-xs"
                      >
                        {isDone ? "✓" : i + 1}
                      </motion.div>
                      <div className="text-center">
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                            isDone || isActive
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-sans">
                          {step.sublabel}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info box: waktu submit */}
            {submittedAt && (
              <div className="mb-4 flex gap-3 rounded-lg bg-muted/40 border border-border px-4 py-3">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={16}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                />
                <div className="text-xs text-muted-foreground font-sans">
                  <span className="font-medium text-foreground">
                    Form dikirim pada{" "}
                  </span>
                  {submittedAt}
                </div>
              </div>
            )}

            {/* Info box: tips */}
            {status === "pending" && (
              <div className="mb-6 flex gap-3 rounded-lg bg-orange-wash/40 dark:bg-pnp-orange/10 border border-pnp-orange/20 px-4 py-3 text-xs text-muted-foreground font-sans">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                  className="mt-0.5 shrink-0 text-pnp-orange"
                />
                <p className="leading-relaxed">
                  Halaman ini akan otomatis memperbarui status setiap 60 detik.
                  Kamu tidak perlu melakukan apa pun — cukup tunggu notifikasi dari pengurus.
                </p>
              </div>
            )}

            {/* CTA: cek manual */}
            {status === "pending" && (
              <button
                onClick={checkStatus}
                disabled={isPolling}
                className="w-full h-11 sm:h-12 rounded-lg border border-border bg-background text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider hover:bg-muted/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HugeiconsIcon
                  icon={ReloadIcon}
                  size={16}
                  className={isPolling ? "animate-spin text-pnp-orange" : "text-pnp-orange"}
                />
                {isPolling ? "Memeriksa..." : "Periksa Status Sekarang"}
              </button>
            )}

            {/* CTA: ke dashboard jika verified */}
            {status === "verified" && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 sm:h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} />
                Masuk ke Dashboard
              </motion.button>
            )}

            {/* Last checked info */}
            {status === "pending" && (
              <p className="mt-3 text-center text-micro font-mono uppercase tracking-wider text-muted-foreground">
                Terakhir diperiksa:{" "}
                {lastChecked.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground font-sans">
          Ada pertanyaan?{" "}
          <a
            href="https://instagram.com/ukmrobotikpnp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pnp-orange hover:underline font-mono text-micro font-semibold uppercase tracking-wider"
          >
            Hubungi kami di Instagram
          </a>
        </p>
      </div>
    </div>
  );
}
