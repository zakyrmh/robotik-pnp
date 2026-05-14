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
    iconClass: "text-amber-500",
    ringClass:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    label: "Menunggu Verifikasi",
    description:
      "Data pendaftaran kamu sedang ditinjau oleh pengurus UKM Robotik PNP. Proses ini biasanya memakan waktu 1–3 hari kerja.",
  },
  verified: {
    icon: CheckmarkBadge01Icon,
    iconClass: "text-emerald-500",
    ringClass:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    label: "Pendaftaran Disetujui",
    description:
      "Selamat! Kamu resmi menjadi anggota UKM Robotik PNP. Kamu akan diarahkan ke dashboard.",
  },
  rejected: {
    icon: Cancel01Icon,
    iconClass: "text-red-500",
    ringClass:
      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800",
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
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
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
    <div className="relative min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-4 sm:p-8">
      {/* Background subtle grid — sama seperti pola onboarding */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header — logo UKM */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">R</span>
            </div>
            <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
              UKM Robotik PNP
            </span>
          </div>
        </div>

        {/* Card utama */}
        <div className="rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
          {/* Top accent bar */}
          <div
            className={`h-1 w-full ${
              status === "pending"
                ? "bg-linear-to-r from-amber-400 to-amber-500"
                : status === "verified"
                  ? "bg-linear-to-r from-emerald-400 to-emerald-500"
                  : "bg-linear-to-r from-red-400 to-red-500"
            }`}
          />

          <div className="px-8 py-10">
            {/* Icon + Badge status */}
            <div className="flex flex-col items-center gap-4 text-center mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={status}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${config.ringClass}`}
                >
                  <HugeiconsIcon
                    icon={StatusIcon}
                    size={40}
                    className={config.iconClass}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="space-y-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeClass}`}
                >
                  {status === "pending" && <PulseDots />}
                  {config.label}
                </span>

                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                  {status === "pending" && <>Hei, {firstName}! 👋</>}
                  {status === "verified" && <>Selamat, {firstName}! 🎉</>}
                  {status === "rejected" && <>Hai, {firstName}</>}
                </h1>

                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Timeline steps */}
            <div className="mb-8">
              <div className="flex items-start justify-between relative">
                {/* Connector line */}
                <div className="absolute top-4 left-4 right-4 h-px bg-neutral-100 dark:bg-neutral-800" />

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
                              ? "rgb(239 68 68)"
                              : "rgb(16 185 129)"
                            : isActive && status === "rejected"
                              ? "rgb(239 68 68)"
                              : isActive
                                ? "rgb(59 130 246)"
                                : "rgb(229 231 235)",
                        }}
                        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm dark:shadow-none"
                      >
                        {isDone ? "✓" : i + 1}
                      </motion.div>
                      <div className="text-center">
                        <p
                          className={`text-xs font-semibold ${
                            isDone || isActive
                              ? "text-neutral-800 dark:text-neutral-200"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
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
              <div className="mb-6 flex gap-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 px-4 py-3">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={16}
                  className="mt-0.5 shrink-0 text-neutral-400"
                />
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    Form dikirim pada{" "}
                  </span>
                  {submittedAt}
                </div>
              </div>
            )}

            {/* Info box: tips */}
            {status === "pending" && (
              <div className="mb-6 flex gap-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                <p className="text-xs leading-relaxed">
                  Halaman ini akan otomatis memperbarui status setiap 60 detik.
                  Kamu tidak perlu melakukan apa pun — cukup tunggu notifikasi
                  dari pengurus.
                </p>
              </div>
            )}

            {/* CTA: cek manual */}
            {status === "pending" && (
              <button
                onClick={checkStatus}
                disabled={isPolling}
                className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HugeiconsIcon
                  icon={ReloadIcon}
                  size={15}
                  className={isPolling ? "animate-spin" : ""}
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
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25"
              >
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} />
                Masuk ke Dashboard
              </motion.button>
            )}

            {/* Last checked info */}
            {status === "pending" && (
              <p className="mt-3 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
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
        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
          Ada pertanyaan?{" "}
          <a
            href="https://instagram.com/ukmrobotikpnp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            Hubungi kami di Instagram
          </a>
        </p>
      </div>
    </div>
  );
}
