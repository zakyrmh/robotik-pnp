"use client";

import { useMemo, useState } from "react";
import { updateEventSettingsAction } from "@/lib/actions/event-admin";
import { getBatchPhase, PHASE_LABELS } from "@/lib/event-batch";
import type { EventSettings, PaymentMode, BankAccount } from "@/types/event-registration";
import {
  CalendarRange,
  Loader2,
  Save,
  Info,
  CreditCard,
  Building2,
  Plus,
  Trash2,
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

const inputClass =
  "w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84] bg-white";

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

  // Initial Bank Accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    if (initialSettings?.bank_accounts && initialSettings.bank_accounts.length > 0) {
      return initialSettings.bank_accounts;
    }
    if (
      initialSettings?.bank_name ||
      initialSettings?.bank_account_number ||
      initialSettings?.bank_account_holder
    ) {
      return [
        {
          bank_name: initialSettings.bank_name || "",
          account_number: initialSettings.bank_account_number || "",
          account_holder: initialSettings.bank_account_holder || "",
        },
      ];
    }
    return [
      { bank_name: "Bank Nagari / BNI", account_number: "", account_holder: "UKM Robotik PNP" },
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const handleAddBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      { bank_name: "", account_number: "", account_holder: "" },
    ]);
  };

  const handleRemoveBankAccount = (index: number) => {
    if (bankAccounts.length <= 1) return;
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const handleUpdateBankAccount = (
    index: number,
    field: keyof BankAccount,
    value: string,
  ) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setBankAccounts(updated);
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
      accent: "border-l-emerald-500",
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
      accent: "border-l-amber-500",
    },
    {
      title: "Technical Meeting",
      hint: "Pelaksanaan Technical Meeting selama 2 hari.",
      start: {
        label: "Mulai TM",
        value: techMeetingStart,
        set: setTechMeetingStart,
      },
      end: { label: "Selesai TM", value: techMeetingEnd, set: setTechMeetingEnd },
      accent: "border-l-purple-500",
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-[#3b5b84]" /> Pengaturan Event &
          Metode Pembayaran
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* METODE PEMBAYARAN SECTION */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <CreditCard className="w-5 h-5 text-[#3b5b84]" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Opsi & Metode Pembayaran Global
              </h3>
              <p className="text-xs text-slate-500">
                Pilih apakah pendaftaran menggunakan Midtrans Payment Gateway atau Transfer Bank Manual.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={cn(
                "flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all bg-white",
                paymentMode === "midtrans"
                  ? "border-[#3b5b84] ring-2 ring-[#3b5b84]/20 bg-blue-50/20"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <input
                type="radio"
                name="payment_mode"
                value="midtrans"
                checked={paymentMode === "midtrans"}
                onChange={() => setPaymentMode("midtrans")}
                className="mt-1 text-[#3b5b84] focus:ring-[#3b5b84]"
              />
              <div>
                <span className="text-sm font-bold text-slate-800 block">
                  Opsi 1: Payment Gateway (Midtrans)
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Peserta bayar via Midtrans (Snap/QRIS). Verifikasi otomatis oleh sistem.
                </p>
              </div>
            </label>

            <label
              className={cn(
                "flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all bg-white",
                paymentMode === "manual_bank"
                  ? "border-[#3b5b84] ring-2 ring-[#3b5b84]/20 bg-blue-50/20"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <input
                type="radio"
                name="payment_mode"
                value="manual_bank"
                checked={paymentMode === "manual_bank"}
                onChange={() => setPaymentMode("manual_bank")}
                className="mt-1 text-[#3b5b84] focus:ring-[#3b5b84]"
              />
              <div>
                <span className="text-sm font-bold text-slate-800 block">
                  Opsi 2: Transfer Bank Manual
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Peserta mentransfer biaya ke rekening bank panitia dan mengunggah bukti pembayaran untuk diverifikasi admin.
                </p>
              </div>
            </label>
          </div>

          {paymentMode === "manual_bank" && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 pt-4 border-l-4 border-l-[#3b5b84]">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-[#3b5b84]" /> Daftar Rekening Bank Penerima (Bisa Lebih dari 1)
                </h4>
                <button
                  type="button"
                  onClick={handleAddBankAccount}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#3b5b84] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Rekening Bank
                </button>
              </div>

              {bankAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Rekening Bank #{idx + 1}
                    </span>
                    {bankAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBankAccount(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Nama Bank *
                      </label>
                      <input
                        type="text"
                        required={paymentMode === "manual_bank"}
                        value={acc.bank_name}
                        onChange={(e) =>
                          handleUpdateBankAccount(idx, "bank_name", e.target.value)
                        }
                        placeholder="Contoh: Bank BRI / BCA / BNI"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Nomor Rekening *
                      </label>
                      <input
                        type="text"
                        required={paymentMode === "manual_bank"}
                        value={acc.account_number}
                        onChange={(e) =>
                          handleUpdateBankAccount(
                            idx,
                            "account_number",
                            e.target.value,
                          )
                        }
                        placeholder="Contoh: 001234567890"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Atas Nama Pemilik Rekening *
                      </label>
                      <input
                        type="text"
                        required={paymentMode === "manual_bank"}
                        value={acc.account_holder}
                        onChange={(e) =>
                          handleUpdateBankAccount(
                            idx,
                            "account_holder",
                            e.target.value,
                          )
                        }
                        placeholder="Contoh: Panitia MRC PNP"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* JADWAL & TIMELINE SECTION */}
        <p className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#3b5b84]" />
          Aturan Bisnis Timeline: Sebelum tanggal Rilis Timeline reached, halaman publik{" "}
          <span className="font-mono font-semibold text-slate-700">/mrc</span> menampilkan "Coming Soon".
          Batch 2 disembunyikan sepenuhnya sampai Batch 1 berakhir.
        </p>

        {/* Tanggal Rilis Timeline Single Field */}
        <div className="bg-slate-50/80 border border-slate-200 border-l-4 border-l-blue-500 rounded-lg p-4 space-y-2">
          <label className="block text-sm font-bold text-slate-800">
            Tanggal Rilis Timeline ke Publik
          </label>
          <p className="text-[11px] text-slate-500">
            Sebelum tanggal ini, timeline publik di halaman /mrc akan berstatus "Coming Soon".
          </p>
          <input
            type="datetime-local"
            value={timelineReleaseDate}
            onChange={(e) => setTimelineReleaseDate(e.target.value)}
            className={inputClass}
          />
        </div>

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
