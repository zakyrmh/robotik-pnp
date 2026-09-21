"use client";

import { useMemo, useState } from "react";
import { updateEventSettingsAction } from "@/lib/actions/event-admin";
import { getBatchPhase, PHASE_LABELS } from "@/lib/event-batch";
import type {
  EventSettings,
  PaymentMode,
  BankAccount,
} from "@/types/event-registration";
import {
  CalendarRange,
  Loader2,
  Save,
  Info,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
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

function initialBanks(s: EventSettings | null): BankAccount[] {
  if (s?.bank_accounts && s.bank_accounts.length > 0) return s.bank_accounts;
  if (s?.bank_name || s?.bank_account_number || s?.bank_account_holder) {
    return [
      {
        bank_name: s.bank_name || "",
        account_number: s.bank_account_number || "",
        account_holder: s.bank_account_holder || "",
      },
    ];
  }
  return [
    {
      bank_name: "Bank Nagari / BNI",
      account_number: "",
      account_holder: "UKM Robotik PNP",
    },
  ];
}

const inputClass =
  "w-full min-h-[44px] px-3 py-2 border border-border rounded-md bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

const labelClass = "block text-sm font-medium text-foreground mb-1";

export function EventSettingsForm({ initialSettings }: EventSettingsFormProps) {
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

  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initialSettings?.payment_mode ?? "midtrans",
  );
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() =>
    initialBanks(initialSettings),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Dirty-state tracking: bandingkan state kini vs snapshot awal ──
  const snapshot = useMemo(
    () =>
      JSON.stringify({
        timelineReleaseDate: toInputValue(
          initialSettings?.timeline_release_date ?? null,
        ),
        batch1Start: toInputValue(initialSettings?.batch1_start ?? null),
        batch1End: toInputValue(initialSettings?.batch1_end ?? null),
        batch2Start: toInputValue(initialSettings?.batch2_start ?? null),
        batch2End: toInputValue(initialSettings?.batch2_end ?? null),
        techMeetingStart: toInputValue(
          initialSettings?.technical_meeting_start ?? null,
        ),
        techMeetingEnd: toInputValue(
          initialSettings?.technical_meeting_end ?? null,
        ),
        eventStart: toInputValue(initialSettings?.event_start ?? null),
        eventEnd: toInputValue(initialSettings?.event_end ?? null),
        paymentMode: initialSettings?.payment_mode ?? "midtrans",
        bankAccounts: initialBanks(initialSettings),
      }),
    [initialSettings],
  );

  const current = JSON.stringify({
    timelineReleaseDate,
    batch1Start,
    batch1End,
    batch2Start,
    batch2End,
    techMeetingStart,
    techMeetingEnd,
    eventStart,
    eventEnd,
    paymentMode,
    bankAccounts,
  });

  const isDirty = current !== snapshot;

  const currentPhase = useMemo(
    () =>
      getBatchPhase(
        initialSettings
          ? {
              ...initialSettings,
              timeline_release_date: fromInputValue(timelineReleaseDate),
              batch1_start: fromInputValue(batch1Start),
              batch1_end: fromInputValue(batch1End),
              batch2_start: fromInputValue(batch2Start),
              batch2_end: fromInputValue(batch2End),
              technical_meeting_start: fromInputValue(techMeetingStart),
              technical_meeting_end: fromInputValue(techMeetingEnd),
              event_start: fromInputValue(eventStart),
              event_end: fromInputValue(eventEnd),
            }
          : null,
      ),
    [
      initialSettings,
      timelineReleaseDate,
      batch1Start,
      batch1End,
      batch2Start,
      batch2End,
      techMeetingStart,
      techMeetingEnd,
      eventStart,
      eventEnd,
    ],
  );

  const handleReset = () => {
    const parsed = JSON.parse(snapshot) as {
      timelineReleaseDate: string;
      batch1Start: string;
      batch1End: string;
      batch2Start: string;
      batch2End: string;
      techMeetingStart: string;
      techMeetingEnd: string;
      eventStart: string;
      eventEnd: string;
      paymentMode: PaymentMode;
      bankAccounts: BankAccount[];
    };
    setTimelineReleaseDate(parsed.timelineReleaseDate);
    setBatch1Start(parsed.batch1Start);
    setBatch1End(parsed.batch1End);
    setBatch2Start(parsed.batch2Start);
    setBatch2End(parsed.batch2End);
    setTechMeetingStart(parsed.techMeetingStart);
    setTechMeetingEnd(parsed.techMeetingEnd);
    setEventStart(parsed.eventStart);
    setEventEnd(parsed.eventEnd);
    setPaymentMode(parsed.paymentMode);
    setBankAccounts(parsed.bankAccounts);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const primaryBank = bankAccounts[0] || {
      bank_name: "",
      account_number: "",
      account_holder: "",
    };

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
      payment_mode: paymentMode,
      bank_name: primaryBank.bank_name,
      bank_account_number: primaryBank.account_number,
      bank_account_holder: primaryBank.account_holder,
      bank_accounts: bankAccounts,
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
      accent: "border-l-success",
    },
    {
      title: "Pendaftaran Batch 2",
      hint: "Disembunyikan dari publik hingga Batch 1 selesai.",
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
      hint: "Pelaksanaan Technical Meeting selama 2 hari.",
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
      accent: "border-l-chart-4",
    },
    {
      title: "Rentang Acara",
      hint: "Hari-H pelaksanaan lomba di Politeknik Negeri Padang.",
      start: { label: "Mulai Acara", value: eventStart, set: setEventStart },
      end: { label: "Selesai Acara", value: eventEnd, set: setEventEnd },
      accent: "border-l-primary",
    },
  ];

  return (
    <div className="relative space-y-6 pb-24">
      {/* Judul blok + status fase */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-display text-md font-semibold text-foreground">
          <CalendarRange
            className="size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          Pengaturan Event & Metode Pembayaran
        </h2>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
            currentPhase.phase === "batch1-open" ||
              currentPhase.phase === "batch2-open"
              ? "border-success/30 bg-success-soft text-success"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          <span
            className="size-1.5 rounded-full bg-current"
            aria-hidden="true"
          />
          {PHASE_LABELS[currentPhase.phase]}
          {isDirty && (
            <span className="font-mono text-micro text-warning">
              · belum disimpan
            </span>
          )}
        </span>
      </div>

      {errorMsg && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
        >
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success-soft p-3 text-xs font-medium text-success"
        >
          {successMsg}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        aria-label="Formulir pengaturan event"
      >
        {/* ── BLOK 1: Metode pembayaran (scope sendiri) ── */}
        <section
          aria-labelledby="blok-pembayaran"
          className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-none sm:p-6"
        >
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <CreditCard
              className="size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <h3
                id="blok-pembayaran"
                className="font-display text-md font-semibold text-foreground"
              >
                Opsi & Metode Pembayaran Global
              </h3>
              <p className="text-sm text-muted-foreground">
                Pilih apakah pendaftaran memakai Midtrans atau transfer bank
                manual.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border bg-background p-4 transition-colors duration-150",
                paymentMode === "midtrans"
                  ? "border-primary ring-2 ring-ring/30"
                  : "border-border hover:border-primary/50",
              )}
            >
              <input
                type="radio"
                name="payment_mode"
                value="midtrans"
                checked={paymentMode === "midtrans"}
                onChange={() => setPaymentMode("midtrans")}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Opsi 1: Payment Gateway (Midtrans)
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Peserta bayar via Midtrans (Snap/QRIS). Verifikasi otomatis
                  oleh sistem.
                </span>
              </span>
            </label>

            <label
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border bg-background p-4 transition-colors duration-150",
                paymentMode === "manual_bank"
                  ? "border-primary ring-2 ring-ring/30"
                  : "border-border hover:border-primary/50",
              )}
            >
              <input
                type="radio"
                name="payment_mode"
                value="manual_bank"
                checked={paymentMode === "manual_bank"}
                onChange={() => setPaymentMode("manual_bank")}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Opsi 2: Transfer Bank Manual
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Peserta transfer ke rekening panitia lalu mengunggah bukti
                  untuk diverifikasi admin.
                </span>
              </span>
            </label>
          </div>

          {paymentMode === "manual_bank" && (
            <div className="space-y-4 rounded-lg border border-border border-l-4 border-l-primary bg-background p-4">
              <div className="flex flex-col gap-2 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <Building2
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Rekening Bank Penerima (bisa lebih dari 1)
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setBankAccounts([
                      ...bankAccounts,
                      {
                        bank_name: "",
                        account_number: "",
                        account_holder: "",
                      },
                    ])
                  }
                  className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Plus className="size-3.5" aria-hidden="true" /> Tambah
                  Rekening Bank
                </button>
              </div>

              {bankAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="relative space-y-3 rounded-lg border border-border bg-secondary p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">
                      Rekening Bank #{idx + 1}
                    </span>
                    {bankAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setBankAccounts(
                            bankAccounts.filter((_, i) => i !== idx),
                          )
                        }
                        aria-label={`Hapus rekening ${idx + 1}`}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Nama Bank *</label>
                      <input
                        type="text"
                        required={paymentMode === "manual_bank"}
                        value={acc.bank_name}
                        onChange={(e) => {
                          const next = [...bankAccounts];
                          next[idx] = {
                            ...next[idx],
                            bank_name: e.target.value,
                          };
                          setBankAccounts(next);
                        }}
                        placeholder="Contoh: Bank BRI / BCA / BNI"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Rekening *</label>
                      <input
                        type="text"
                        required={paymentMode === "manual_bank"}
                        value={acc.account_number}
                        onChange={(e) => {
                          const next = [...bankAccounts];
                          next[idx] = {
                            ...next[idx],
                            account_number: e.target.value,
                          };
                          setBankAccounts(next);
                        }}
                        placeholder="Contoh: 001234567890"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Atas Nama *</label>
                      <input
                        type="text"
                        required={paymentMode === "manual_bank"}
                        value={acc.account_holder}
                        onChange={(e) => {
                          const next = [...bankAccounts];
                          next[idx] = {
                            ...next[idx],
                            account_holder: e.target.value,
                          };
                          setBankAccounts(next);
                        }}
                        placeholder="Contoh: Panitia MRC PNP"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── BLOK 2: Rilis timeline ── */}
        <section
          aria-labelledby="blok-rilis"
          className="space-y-2 rounded-lg border border-border border-l-4 border-l-chart-2 bg-card p-4 sm:p-5"
        >
          <h3
            id="blok-rilis"
            className="font-display text-md font-semibold text-foreground"
          >
            Tanggal Rilis Timeline ke Publik
          </h3>
          <p className="max-w-prose text-sm text-muted-foreground">
            Sebelum tanggal ini, timeline publik di halaman /mrc berstatus
            “Coming Soon”.
          </p>
          <input
            type="datetime-local"
            value={timelineReleaseDate}
            onChange={(e) => setTimelineReleaseDate(e.target.value)}
            className={cn(inputClass, "max-w-md")}
            aria-label="Tanggal rilis timeline"
          />
          <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary p-3 text-sm text-muted-foreground">
            <Info
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            Batch 2 disembunyikan sepenuhnya sampai Batch 1 berakhir.
          </p>
        </section>

        {/* ── BLOK 3: Jadwal batch & acara ── */}
        <section
          aria-labelledby="blok-jadwal"
          className="space-y-4 rounded-lg border border-border bg-card p-5 sm:p-6"
        >
          <div>
            <h3
              id="blok-jadwal"
              className="font-display text-md font-semibold text-foreground"
            >
              Jadwal Batch & Acara
            </h3>
            <p className="text-sm text-muted-foreground">
              Setiap rentang waktu disimpan bersamaan lewat sticky save bar di
              bawah.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ranges.map((r) => (
              <fieldset
                key={r.title}
                className={cn(
                  "space-y-3 rounded-lg border border-border border-l-4 bg-secondary/60 p-4",
                  r.accent,
                )}
              >
                <div>
                  <legend className="font-display text-sm font-semibold text-foreground">
                    {r.title}
                  </legend>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {r.hint}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>{r.start.label}</label>
                  <input
                    type="datetime-local"
                    value={r.start.value}
                    onChange={(e) => r.start.set(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{r.end.label}</label>
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
        </section>

        {/* ── Sticky Save Bar: hanya muncul saat dirty ── */}
        <div
          aria-live="polite"
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 transition-all duration-200",
            isDirty
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-full opacity-0",
          )}
        >
          <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/95 p-4 shadow-[var(--shadow-soft)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="size-2 shrink-0 animate-pulse rounded-full bg-warning"
                  aria-hidden="true"
                />
                Ada perubahan belum disimpan.
                <span className="hidden font-mono text-micro text-muted-foreground sm:inline">
                  (dirty state aktif)
                </span>
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Batalkan
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {isSubmitting ? "Menyimpan…" : "Simpan Pengaturan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
