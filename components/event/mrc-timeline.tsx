"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Flag,
  Layers,
  Sparkles,
} from "lucide-react";
import type { EventSettings } from "@/types/event-registration";
import { isTimelineReleased, isBatch2Visible } from "@/lib/event-batch";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  title: string;
  date: string;
  /** ISO date string for comparison — use the START of the relevant date */
  isoDate: string;
  /** Optional ISO end date for multi-day events */
  isoDateEnd?: string;
  description: string;
  icon: typeof Clock;
}

interface MrcTimelineProps {
  settings?: EventSettings | null;
}

function formatIdDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function buildTimeline(
  settings?: EventSettings | null,
  nowDate: Date = new Date(),
): TimelineEvent[] {
  if (
    settings &&
    (settings.batch1_start || settings.batch2_start || settings.event_start)
  ) {
    const events: TimelineEvent[] = [];

    // Batch 1
    if (settings.batch1_start && settings.batch1_end) {
      events.push({
        title: "Pendaftaran Batch 1",
        date: `${formatIdDate(settings.batch1_start)} – ${formatIdDate(settings.batch1_end)}`,
        isoDate: settings.batch1_start.slice(0, 10),
        isoDateEnd: settings.batch1_end.slice(0, 10),
        description: "Gelombang pertama pendaftaran tim Minangkabau Robot Contest.",
        icon: Clock,
      });
    }

    // Batch 2 (Tampil HANYA jika isBatch2Visible === true)
    if (
      settings.batch2_start &&
      settings.batch2_end &&
      isBatch2Visible(settings, nowDate)
    ) {
      events.push({
        title: "Pendaftaran Batch 2",
        date: `${formatIdDate(settings.batch2_start)} – ${formatIdDate(settings.batch2_end)}`,
        isoDate: settings.batch2_start.slice(0, 10),
        isoDateEnd: settings.batch2_end.slice(0, 10),
        description: "Gelombang kedua pendaftaran tim Minangkabau Robot Contest.",
        icon: Layers,
      });
    }

    // Technical Meeting
    if (settings.technical_meeting_start) {
      const tmEnd =
        settings.technical_meeting_end ?? settings.technical_meeting_start;
      events.push({
        title: "Technical Meeting & Verification",
        date:
          settings.technical_meeting_end &&
          settings.technical_meeting_end !== settings.technical_meeting_start
            ? `${formatIdDate(settings.technical_meeting_start)} – ${formatIdDate(tmEnd)}`
            : formatIdDate(settings.technical_meeting_start),
        isoDate: settings.technical_meeting_start.slice(0, 10),
        isoDateEnd: tmEnd.slice(0, 10),
        description:
          "Uji coba lintasan/lapangan, verifikasi fisik tim, dan pembagian urutan tampil.",
        icon: MapPin,
      });
    }

    // Hari-H Lomba
    if (settings.event_start) {
      const end = settings.event_end ?? settings.event_start;
      events.push({
        title: "Hari-H Pelaksanaan Lomba",
        date:
          settings.event_end && settings.event_end !== settings.event_start
            ? `${formatIdDate(settings.event_start)} – ${formatIdDate(end)}`
            : formatIdDate(settings.event_start),
        isoDate: settings.event_start.slice(0, 10),
        isoDateEnd: end.slice(0, 10),
        description:
          "Babak penyisihan hingga final di Gedung Kampus Politeknik Negeri Padang.",
        icon: Flag,
      });
    }

    if (events.length > 0) return events;
  }

  // Fallback legacy statis bila settings belum dikonfigurasi
  return [
    {
      title: "Pembukaan Pendaftaran Batch 1",
      date: "15 September 2026",
      isoDate: "2026-09-15",
      description:
        "Pengisian form online, upload foto anggota, dan pendaftaran tim.",
      icon: Clock,
    },
    {
      title: "Technical Meeting & Verification",
      date: "13 – 14 Oktober 2026",
      isoDate: "2026-10-13",
      isoDateEnd: "2026-10-14",
      description:
        "Uji coba lintasan/lapangan, verifikasi fisik, dan pembagian urutan tampil.",
      icon: MapPin,
    },
    {
      title: "Hari-H Pelaksanaan Lomba",
      date: "15 – 17 Oktober 2026",
      isoDate: "2026-10-15",
      isoDateEnd: "2026-10-17",
      description:
        "Babak penyisihan hingga final di Gedung Kampus Politeknik Negeri Padang.",
      icon: Flag,
    },
  ];
}

/**
 * Computes status based on current date:
 * - "completed" if today is past the event date (or end date for multi-day)
 * - "active" if today matches or is within the event period
 * - "upcoming" if today is before the event date
 */
function computeStatus(
  evt: TimelineEvent,
  today: string,
): "completed" | "active" | "upcoming" {
  const endDate = evt.isoDateEnd ?? evt.isoDate;
  if (today > endDate) return "completed";
  if (today >= evt.isoDate && today <= endDate) return "active";
  return "upcoming";
}

export function MrcTimeline({ settings }: MrcTimelineProps) {
  const nowDate = new Date();
  const today = nowDate.toISOString().slice(0, 10);
  const released = isTimelineReleased(settings, nowDate);
  const timelineEvents = buildTimeline(settings, nowDate);

  return (
    <section className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary bg-primary-soft/50 dark:bg-primary-soft/20 px-3 py-1 rounded-full border border-primary/20">
          Agenda Kegiatan
        </span>
        <h2 className="font-display font-bold text-balance">
          Timeline Minangkabau Robot Contest
        </h2>
        <p className="font-body text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          Jadwal tahapan pendaftaran hingga hari puncak kompetisi.
        </p>
      </div>

      {!released ? (
        /* Coming Soon Banner jika timeline belum rilis ke publik */
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-soft space-y-3 max-w-2xl mx-auto">
          <div className="size-12 rounded-full bg-primary-soft/80 text-primary flex items-center justify-center mx-auto">
            <Sparkles className="size-6 animate-pulse" />
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
            Timeline Kegiatan: Coming Soon
          </h3>
          <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Jadwal pendaftaran dan pelaksanaan Minangkabau Robot Contest X akan
            segera dirilis secara resmi oleh panitia. Pantau terus halaman ini
            untuk mendapatkan pembaruan informasi terkini!
          </p>
        </div>
      ) : (
        /* Timeline List */
        <div className="rounded-lg border border-border bg-card p-6 shadow-2xs">
          <div className="relative border-l-2 border-primary/30 ml-4 sm:ml-6 space-y-8 py-2">
            {timelineEvents.map((evt, idx) => {
              const Icon = evt.icon;
              const status = computeStatus(evt, today);
              const isActive = status === "active";
              const isCompleted = status === "completed";

              return (
                <div key={idx} className="relative pl-6 sm:pl-8 group">
                  {/* Node Dot */}
                  <div
                    className={cn(
                      "absolute -left-[17px] top-1 size-8 rounded-full border-2 flex items-center justify-center transition-colors shadow-2xs",
                      isCompleted
                        ? "bg-success/15 text-success border-success/40"
                        : isActive
                          ? "bg-primary text-primary-foreground border-primary ring-4 ring-primary/15"
                          : "bg-card text-muted-foreground border-border group-hover:border-primary/50",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>

                  {/* Content Card */}
                  <div className="space-y-1 bg-muted/40 p-4 rounded-lg border border-border/70 hover:border-border transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="font-display font-bold text-sm sm:text-base text-foreground">
                        {evt.title}
                      </h3>
                      <span className="font-mono text-xs font-semibold text-primary bg-primary-soft/60 dark:bg-primary-soft/30 px-2.5 py-0.5 rounded border border-primary/20 w-fit">
                        {evt.date}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
