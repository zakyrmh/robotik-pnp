"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  ArrowRight,
  FileText,
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  getBatchPhase,
  PHASE_LABELS,
  type BatchPhase,
} from "@/lib/event-batch";
import type { EventSettings } from "@/types/event-registration";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface MrcHeroProps {
  settings?: EventSettings | null;
}

/** Fallback bila settings belum dikonfigurasi (jadwal legacy). */
const LEGACY_EVENT_TARGET = new Date("2026-10-15T09:00:00+07:00").getTime();

function formatIdDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function MrcHero({ settings }: MrcHeroProps) {
  const [now, setNow] = useState(() => Date.now());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Tandai mounted di dalam callback (bukan sinkron di body effect) agar
    // countdown hanya dirender di client (hindari hydration mismatch) tanpa
    // melanggar react-hooks/set-state-in-effect.
    const frame = requestAnimationFrame(() => setIsMounted(true));
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, []);

  const phase: BatchPhase = useMemo(
    () => getBatchPhase(settings, new Date(now)),
    [settings, now],
  );

  const targetDate = useMemo(() => {
    if (phase.countdownTarget) return new Date(phase.countdownTarget).getTime();
    return LEGACY_EVENT_TARGET;
  }, [phase]);

  const timeLeft: CountdownTime = useMemo(() => {
    const difference = targetDate - now;
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      ),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  }, [targetDate, now]);

  const countdownLabel =
    phase.phase === "unconfigured"
      ? "Hitung Mundur Menuju Hari-H Lomba"
      : PHASE_LABELS[phase.phase];

  const showCountdown =
    phase.phase !== "event-ended" &&
    phase.phase !== "event-ongoing" &&
    (phase.countdownTarget !== null || phase.phase === "unconfigured");

  const eventStartLabel = formatIdDate(settings?.event_start ?? null);
  const eventEndLabel = formatIdDate(settings?.event_end ?? null);
  const eventRangeLabel =
    eventStartLabel && eventEndLabel
      ? eventStartLabel === eventEndLabel
        ? eventStartLabel
        : `${eventStartLabel} – ${eventEndLabel}`
      : (eventStartLabel ?? "15 – 17 Oktober 2026");

  const isRegistrationOpen =
    phase.phase === "batch1-open" || phase.phase === "batch2-open";
  const activeBatchLabel =
    phase.phase === "batch1-open"
      ? "Batch 1"
      : phase.phase === "batch2-open"
        ? "Batch 2"
        : null;

  return (
    <section className="relative overflow-hidden rounded-lg border border-border bg-card p-6 sm:p-10 shadow-soft">
      {/* Background Accent Gradient Glow */}
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-accent-strong/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Brand Event Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary-soft/60 dark:bg-primary-soft/20 text-primary text-xs font-semibold tracking-wide uppercase"
        >
          <Sparkles className="size-3.5 text-accent-strong motion-safe:animate-pulse" />
          <span>
            Minangkabau Robot Contest 2026
            {activeBatchLabel
              ? ` • Pendaftaran ${activeBatchLabel} Dibuka`
              : ""}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="font-display font-extrabold text-2xl text-balance"
        >
          Kompetisi Robotika & <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-primary-hover to-accent-strong">
            Inovasi Teknologi
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="font-body text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Tunjukkan kemampuan dan rancangan robotik terbaik tim Anda di
          Minangkabau Robot Contest. Rebut trofi kejuaraan, sertifikat resmi,
          dan hadiah jutaan rupiah!
        </motion.p>

        {/* Quick Meta Info (Date & Location) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-medium text-foreground/80 pt-1"
        >
          <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md border border-border/80">
            <Calendar className="size-4 text-primary" />
            <span>{eventRangeLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md border border-border/80">
            <MapPin className="size-4 text-accent-strong" />
            <span>Politeknik Negeri Padang</span>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        {isMounted && showCountdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="pt-2"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
              {countdownLabel}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
              {[
                { label: "Hari", value: timeLeft.days },
                { label: "Jam", value: timeLeft.hours },
                { label: "Menit", value: timeLeft.minutes },
                { label: "Detik", value: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg border border-border bg-background shadow-2xs"
                >
                  <span className="font-mono font-bold text-lg sm:text-2xl text-primary">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="font-body text-[10px] sm:text-xs text-muted-foreground font-medium">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Buttons Cluster */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
        >
          {isRegistrationOpen || phase.phase === "unconfigured" ? (
            <a
              href="#kategori"
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-6 py-3 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trophy className="size-4 text-accent" />
              <span>
                Daftarkan Tim Sekarang
                {activeBatchLabel ? ` (${activeBatchLabel})` : ""}
              </span>
              <ArrowRight className="size-4" />
            </a>
          ) : (
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-body text-sm font-medium px-6 py-3 rounded-lg border border-border bg-muted text-muted-foreground">
              <Trophy className="size-4" />
              <span>{PHASE_LABELS[phase.phase]}</span>
            </span>
          )}

          <a
            href="#rulebook"
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-medium px-5 py-3 rounded-md border border-border bg-card hover:bg-muted text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileText className="size-4 text-muted-foreground" />
            <span>Unduh Rulebook & FAQ</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
