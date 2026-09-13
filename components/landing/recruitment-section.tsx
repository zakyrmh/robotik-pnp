"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecruitmentSectionProps {
  statusPendaftaran: boolean;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  periodeRecruitment?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function RecruitmentSection({
  statusPendaftaran,
  tanggalMulai,
  tanggalSelesai,
  periodeRecruitment,
}: RecruitmentSectionProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, []);

  const startDate = tanggalMulai ? new Date(tanggalMulai) : null;
  const endDate = tanggalSelesai ? new Date(tanggalSelesai) : null;

  // Determine State
  // 1) status_pendaftaran === false -> "Coming Soon"
  // 2) status_pendaftaran === true:
  //    a) now < startDate -> Countdown to startDate ("Pendaftaran akan dibuka dalam...")
  //    b) now >= startDate && now < endDate -> Countdown to endDate ("Pendaftaran akan ditutup dalam...")
  //    c) now >= endDate -> "Pendaftaran telah ditutup"

  let state: "coming_soon" | "opening_soon" | "open" | "closed" = "coming_soon";
  let targetDate: Date | null = null;
  let labelText = "Coming Soon";
  let badgeText = "Pendaftaran Calon Anggota Baru";

  if (statusPendaftaran && startDate && endDate && now) {
    if (now < startDate) {
      state = "opening_soon";
      targetDate = startDate;
      labelText = "Pendaftaran akan dibuka dalam...";
      badgeText = "Segera Dibuka";
    } else if (now >= startDate && now < endDate) {
      state = "open";
      targetDate = endDate;
      labelText = "Pendaftaran akan ditutup dalam...";
      badgeText = "Pendaftaran Dibuka";
    } else {
      state = "closed";
      labelText = "Pendaftaran telah ditutup";
      badgeText = "Pendaftaran Ditutup";
    }
  } else if (statusPendaftaran && (!startDate || !endDate)) {
    // If dates are not set yet, default to open/coming soon
    state = "coming_soon";
    labelText = "Coming Soon";
  }

  // Calculate Time Remaining
  function calculateTimeLeft(
    target: Date | null,
    current: Date | null,
  ): TimeLeft {
    if (!target || !current)
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = target.getTime() - current.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  const timeLeft = calculateTimeLeft(targetDate, now);

  const formatDateStr = (d: Date | null) => {
    if (!d) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  };

  return (
    <section className="relative w-full py-16 md:py-24 bg-surface/50 border-y border-border overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 right-0 w-72 h-72 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        <div className="bg-card border border-border rounded-xl shadow-lg p-6 sm:p-10 md:p-12 transition-all">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {/* Left Content */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {badgeText}{" "}
                  {periodeRecruitment ? `(${periodeRecruitment})` : ""}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground font-display">
                Open Recruitment{" "}
                <span className="text-primary">UKM Robotik PNP</span>
              </h2>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
                Bergabunglah bersama keluarga besar UKM Robotik Politeknik
                Negeri Padang. Asah skill hardware, software, mekanik, serta
                kompetisi tingkat nasional KRI.
              </p>

              {(startDate || endDate) && (
                <div className="inline-flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-muted-foreground pt-2">
                  {startDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        Buka:{" "}
                        <strong className="text-foreground font-medium">
                          {formatDateStr(startDate)}
                        </strong>
                      </span>
                    </div>
                  )}
                  {endDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-accent" />
                      <span>
                        Tutup:{" "}
                        <strong className="text-foreground font-medium">
                          {formatDateStr(endDate)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto font-medium gap-2 shadow-sm"
                  disabled={state === "closed"}
                >
                  <Link
                    href={state === "open" ? "/register" : "/pendaftaran-caang"}
                  >
                    <UserPlus className="w-4 h-4" />
                    {state === "open"
                      ? "Daftar Sekarang"
                      : "Informasi Pendaftaran"}
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto font-medium gap-2"
                >
                  <Link href="/pendaftaran-caang#faq">
                    <span>Panduan & FAQ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Side: Status Display / Countdown */}
            <div className="w-full md:w-auto flex flex-col items-center justify-center min-w-[280px] sm:min-w-[340px] bg-surface border border-border/80 rounded-lg p-6 text-center">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {labelText}
              </span>

              {state === "coming_soon" && (
                <div className="py-6 px-8 rounded-lg bg-card border border-dashed border-border w-full">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-widest text-primary font-display">
                    COMING SOON
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    Jadwal pendaftaran akan diumumkan segera
                  </p>
                </div>
              )}

              {state === "closed" && (
                <div className="py-6 px-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive w-full">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight">
                    Pendaftaran telah ditutup
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sampai jumpa pada periode pendaftaran berikutnya!
                  </p>
                </div>
              )}

              {(state === "opening_soon" || state === "open") && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
                  <div className="flex flex-col items-center justify-center bg-card border border-border p-2.5 sm:p-3 rounded-lg shadow-xs">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase mt-1 font-medium">
                      Hari
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-card border border-border p-2.5 sm:p-3 rounded-lg shadow-xs">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase mt-1 font-medium">
                      Jam
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-card border border-border p-2.5 sm:p-3 rounded-lg shadow-xs">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase mt-1 font-medium">
                      Menit
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-card border border-border p-2.5 sm:p-3 rounded-lg shadow-xs">
                    <span className="text-2xl sm:text-3xl font-bold text-primary font-mono animate-pulse">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase mt-1 font-medium">
                      Detik
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
