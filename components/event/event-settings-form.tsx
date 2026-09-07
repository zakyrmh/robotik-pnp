"use client";

import { useMemo, useState } from "react";
import { updateEventSettingsAction } from "@/lib/actions/event-admin";
import { getBatchPhase, PHASE_LABELS } from "@/lib/event-batch";
import type { EventSettings } from "@/types/event-registration";
import { CalendarRange, Loader2, Save, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventSettingsFormProps {
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
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const inputClass =
  "w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84] bg-white";

export function EventSettingsForm({ initialSettings }: EventSettingsFormProps) {
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
  const [eventStart, setEventStart] = useState(() =>
    toInputValue(initialSettings?.event_start ?? null),
  );
  const [eventEnd, setEventEnd] = useState(() =>
    toInputValue(initialSettings?.event_end ?? null),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentPhase = useMemo(
    () =>
      getBatchPhase(
        initialSettings
          ? {
              ...initialSettings,
              batch1_start: fromInputValue(batch1Start),
              batch1_end: fromInputValue(batch1End),
              batch2_start: fromInputValue(batch2Start),
              batch2_end: fromInputValue(batch2End),
              event_start: fromInputValue(eventStart),
              event_end: fromInputValue(eventEnd),
            }
          : null,
      ),
    [
      initialSettings,
      batch1Start,
      batch1End,
      batch2Start,
      batch2End,
      eventStart,
      eventEnd,
    ],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateEventSettingsAction({
      batch1_start: fromInputValue(batch1Start),
      batch1_end: fromInputValue(batch1End),
      batch2_start: fromInputValue(batch2Start),
      batch2_end: fromInputValue(batch2End),
      event_start: fromInputValue(eventStart),
      event_end: fromInputValue(eventEnd),
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg(res.message || "Pengaturan berhasil disimpan.");
    } else {
      setErrorMsg(res.error || "Gagal menyimpan pengaturan.");
    }
  };

  const ranges = [
    {
      title: "Pendaftaran Batch 1",
      hint: "Countdown & biaya Batch 1 mengikuti rentang ini.",
      start: {
        label: "Mulai Batch 1",
        value: batch1Start,
        set: setBatch1Start,
      },
      end: { label: "Selesai Batch 1", value: batch1End, set: setBatch1End },
      accent: "border-l-emerald-500",
    },
    {
      title: "Pendaftaran Batch 2",
      hint: "Countdown & biaya Batch 2 mengikuti rentang ini.",
      start: {
        label: "Mulai Batch 2",
        value: batch2Start,
        set: setBatch2Start,
      },
      end: { label: "Selesai Batch 2", value: batch2End, set: setBatch2End },
      accent: "border-l-amber-500",
    },
    {
      title: "Rentang Acara",
      hint: "Hari-H pelaksanaan lomba di Politeknik Negeri Padang.",
      start: { label: "Mulai Acara", value: eventStart, set: setEventStart },
      end: { label: "Selesai Acara", value: eventEnd, set: setEventEnd },
      accent: "border-l-[#3b5b84]",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-[#3b5b84]" /> Pengaturan Jadwal
          & Batch
        </h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
            currentPhase.phase === "batch1-open" ||
              currentPhase.phase === "batch2-open"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200",
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {PHASE_LABELS[currentPhase.phase]}
        </span>
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#3b5b84]" />
        Rentang Batch 1 & Batch 2 mengendalikan countdown di halaman publik
        <span className="font-mono font-semibold text-slate-700">
          /mrc
        </span>{" "}
        serta biaya yang dikenakan saat tim mendaftar (biaya Batch 1 / Batch 2
        diatur per kategori di bawah). Urutan wajib: Batch 1 → Batch 2 → Acara.
      </p>

      {errorMsg && (
        <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          {successMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ranges.map((r) => (
            <fieldset
              key={r.title}
              className={cn(
                "border border-slate-200 border-l-4 rounded-lg p-4 space-y-3 bg-slate-50/50",
                r.accent,
              )}
            >
              <div>
                <legend className="text-sm font-bold text-slate-800">
                  {r.title}
                </legend>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.hint}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {r.start.label}
                </label>
                <input
                  type="datetime-local"
                  value={r.start.value}
                  onChange={(e) => r.start.set(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {r.end.label}
                </label>
                <input
                  type="datetime-local"
                  value={r.end.value}
                  onChange={(e) => r.end.set(e.target.value)}
                  className={inputClass}
                />
              </div>
            </fieldset>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b5b84] text-white text-sm font-semibold rounded-lg hover:bg-[#2f4a6d] transition-colors disabled:opacity-60 min-h-[44px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </form>
    </div>
  );
}
