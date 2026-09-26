"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateEventSettingsAction } from "@/lib/actions/event-admin";
import { getBatchPhase, PHASE_LABELS } from "@/lib/event-batch";
import type { EventSettings } from "@/types/event-registration";
import {
  CalendarRange,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
} from "lucide-react";

interface EventTimelineFormProps {
  initialSettings: EventSettings | null;
}

function toInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromInputValue(value: string): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

export function EventTimelineForm({ initialSettings }: EventTimelineFormProps) {
  const [timelineReleaseDate, setTimelineReleaseDate] = useState(() =>
    toInputValue(initialSettings?.timeline_release_date ?? null),
  );
  const [batch1Start, setBatch1Start] = useState(() =>
    toInputValue(initialSettings?.batch1_start ?? null),
  );
  const [batch1End, setBatch1End] = useState(() =>
    toInputValue(initialSettings?.batch1_end ?? null),
  );
  const [batch2Start, setBatch2Start] = useState(() =>
    toInputValue(initialSettings?.batch2_start ?? null),
  );
  const [batch2End, setBatch2End] = useState(() =>
    toInputValue(initialSettings?.batch2_end ?? null),
  );
  const [techMeetingStart, setTechMeetingStart] = useState(() =>
    toInputValue(initialSettings?.technical_meeting_start ?? null),
  );
  const [techMeetingEnd, setTechMeetingEnd] = useState(() =>
    toInputValue(initialSettings?.technical_meeting_end ?? null),
  );
  const [eventStart, setEventStart] = useState(() =>
    toInputValue(initialSettings?.event_start ?? null),
  );
  const [eventEnd, setEventEnd] = useState(() =>
    toInputValue(initialSettings?.event_end ?? null),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mockMergedSettings: EventSettings = {
    id: 1,
    timeline_release_date: fromInputValue(timelineReleaseDate),
    batch1_start: fromInputValue(batch1Start),
    batch1_end: fromInputValue(batch1End),
    batch2_start: fromInputValue(batch2Start),
    batch2_end: fromInputValue(batch2End),
    technical_meeting_start: fromInputValue(techMeetingStart),
    technical_meeting_end: fromInputValue(techMeetingEnd),
    event_start: fromInputValue(eventStart),
    event_end: fromInputValue(eventEnd),
    payment_mode: initialSettings?.payment_mode ?? "midtrans",
    bank_name: initialSettings?.bank_name ?? null,
    bank_account_number: initialSettings?.bank_account_number ?? null,
    bank_account_holder: initialSettings?.bank_account_holder ?? null,
    bank_accounts: initialSettings?.bank_accounts ?? null,
    created_at: initialSettings?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const currentPhase = getBatchPhase(mockMergedSettings);

  const handleReset = () => {
    setTimelineReleaseDate(
      toInputValue(initialSettings?.timeline_release_date ?? null),
    );
    setBatch1Start(toInputValue(initialSettings?.batch1_start ?? null));
    setBatch1End(toInputValue(initialSettings?.batch1_end ?? null));
    setBatch2Start(toInputValue(initialSettings?.batch2_start ?? null));
    setBatch2End(toInputValue(initialSettings?.batch2_end ?? null));
    setTechMeetingStart(
      toInputValue(initialSettings?.technical_meeting_start ?? null),
    );
    setTechMeetingEnd(
      toInputValue(initialSettings?.technical_meeting_end ?? null),
    );
    setEventStart(toInputValue(initialSettings?.event_start ?? null));
    setEventEnd(toInputValue(initialSettings?.event_end ?? null));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateEventSettingsAction({
      timeline_release_date: fromInputValue(timelineReleaseDate),
      batch1_start: fromInputValue(batch1Start),
      batch1_end: fromInputValue(batch1End),
      batch2_start: fromInputValue(batch2Start),
      batch2_end: fromInputValue(batch2End),
      technical_meeting_start: fromInputValue(techMeetingStart),
      technical_meeting_end: fromInputValue(techMeetingEnd),
      event_start: fromInputValue(eventStart),
      event_end: fromInputValue(eventEnd),
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg("Jadwal timeline & batch berhasil diperbarui.");
    } else {
      setErrorMsg(res.error || "Gagal menyimpan pengaturan timeline.");
    }
  };

  const ranges = [
    {
      title: "Pendaftaran Batch 1",
      hint: "Countdown & biaya pendaftaran Batch 1 mengikuti rentang tanggal ini.",
      start: {
        label: "Mulai Batch 1",
        value: batch1Start,
        set: setBatch1Start,
      },
      end: { label: "Selesai Batch 1", value: batch1End, set: setBatch1End },
      accent: "border-l-success",
    },
    {
      title: "Pendaftaran Batch 2",
      hint: "Disembunyikan dari publik hingga pendaftaran Batch 1 berakhir.",
      start: {
        label: "Mulai Batch 2",
        value: batch2Start,
        set: setBatch2Start,
      },
      end: { label: "Selesai Batch 2", value: batch2End, set: setBatch2End },
      accent: "border-l-warning",
    },
    {
      title: "Technical Meeting",
      hint: "Pelaksanaan Technical Meeting & pengarahan peserta.",
      start: {
        label: "Mulai TM",
        value: techMeetingStart,
        set: setTechMeetingStart,
      },
      end: {
        label: "Selesai TM",
        value: techMeetingEnd,
        set: setTechMeetingEnd,
      },
      accent: "border-l-primary",
    },
    {
      title: "Hari Pertandingan (Event)",
      hint: "Hari-H pelaksanaan turnamen MRC di Kampus Politeknik Negeri Padang.",
      start: { label: "Mulai Acara", value: eventStart, set: setEventStart },
      end: { label: "Selesai Acara", value: eventEnd, set: setEventEnd },
      accent: "border-l-accent-strong",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-2">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Manajemen Timeline & Jadwal Event
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Atur rentang waktu rilis informasi, gelombang pendaftaran (Batch 1 &
          2), Technical Meeting, dan hari pertandingan.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Status Fase */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Clock
              className="size-5 text-primary shrink-0"
              aria-hidden="true"
            />
            <div>
              <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground block">
                Fase Yang Berjalan
              </span>
              <span className="font-display text-base font-bold text-foreground">
                {PHASE_LABELS[currentPhase.phase]}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-md border border-border">
            Aturan: Batch 1 &lt; Batch 2 &lt; TM &lt; Event
          </span>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-4 text-xs font-medium text-success">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Rilis Timeline Publik ── */}
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <CalendarRange
              className="size-5 text-primary shrink-0"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-display text-md font-semibold text-foreground">
                Tanggal Rilis Informasi Halaman MRC
              </h2>
              <p className="text-xs text-muted-foreground">
                Sebelum tanggal ini, jadwal di halaman publik akan menampilkan
                status rilis segera.
              </p>
            </div>
          </div>

          <div className="max-w-md space-y-2">
            <label
              htmlFor="timeline_release_date"
              className="block text-xs font-semibold text-foreground"
            >
              Tanggal & Waktu Rilis Informasi Publik
            </label>
            <input
              id="timeline_release_date"
              type="datetime-local"
              value={timelineReleaseDate}
              onChange={(e) => setTimelineReleaseDate(e.target.value)}
              className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </section>

        {/* ── Rentang Gelombang & Acara ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ranges.map((r, i) => (
            <section
              key={i}
              className={cn(
                "rounded-lg border border-border bg-card p-5 shadow-xs border-l-4 space-y-4",
                r.accent,
              )}
            >
              <div>
                <h2 className="font-display text-sm font-bold text-foreground">
                  {r.title}
                </h2>
                <p className="text-xs text-muted-foreground">{r.hint}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-micro font-semibold text-foreground">
                    {r.start.label}
                  </label>
                  <input
                    type="datetime-local"
                    value={r.start.value}
                    onChange={(e) => r.start.set(e.target.value)}
                    className="w-full min-h-[44px] rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-micro font-semibold text-foreground">
                    {r.end.label}
                  </label>
                  <input
                    type="datetime-local"
                    value={r.end.value}
                    onChange={(e) => r.end.set(e.target.value)}
                    className="w-full min-h-[44px] rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Info Petunjuk PRD 3.4 */}
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
          <Info
            className="size-4 text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p>
            Batch pendaftaran menentukan secara otomatis nominal biaya yang
            berlaku (
            <code className="font-mono font-semibold text-foreground">
              registration_fee_batch1
            </code>{" "}
            /{" "}
            <code className="font-mono font-semibold text-foreground">
              registration_fee_batch2
            </code>{" "}
            di Kategori) saat peserta mendaftar via formulir publik.
          </p>
        </div>

        {/* Sticky Form Action Footer */}
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-border bg-card/95 backdrop-blur-md p-4 shadow-md">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>Reset Perubahan</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <Save className="size-4" aria-hidden="true" />
            <span>
              {isSubmitting ? "Menyimpan..." : "Simpan Jadwal Timeline"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
