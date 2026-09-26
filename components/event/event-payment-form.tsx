"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateEventSettingsAction } from "@/lib/actions/event-admin";
import type {
  EventSettings,
  PaymentMode,
  BankAccount,
} from "@/types/event-registration";
import {
  CreditCard,
  Building2,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
} from "lucide-react";

interface EventPaymentFormProps {
  initialSettings: EventSettings | null;
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
      bank_name: "Bank Nagari",
      account_number: "2101-0210-9876",
      account_holder: "UKM Robotik Politeknik Negeri Padang",
    },
  ];
}

export function EventPaymentForm({ initialSettings }: EventPaymentFormProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initialSettings?.payment_mode ?? "midtrans",
  );
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() =>
    initialBanks(initialSettings),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddBank = () => {
    setBankAccounts((prev) => [
      ...prev,
      { bank_name: "", account_number: "", account_holder: "" },
    ]);
  };

  const handleRemoveBank = (index: number) => {
    setBankAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBankChange = (
    index: number,
    field: keyof BankAccount,
    value: string,
  ) => {
    setBankAccounts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleReset = () => {
    setPaymentMode(initialSettings?.payment_mode ?? "midtrans");
    setBankAccounts(initialBanks(initialSettings));
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
      payment_mode: paymentMode,
      bank_name: primaryBank.bank_name,
      bank_account_number: primaryBank.account_number,
      bank_account_holder: primaryBank.account_holder,
      bank_accounts: bankAccounts,
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg("Pengaturan metode pembayaran berhasil disimpan.");
    } else {
      setErrorMsg(res.error || "Gagal menyimpan pengaturan pembayaran.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-2">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Pengaturan Metode Pembayaran
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Pilih metode pembayaran pendaftaran MRC (Midtrans / Transfer Bank
          Manual) dan kelola daftar rekening penerima.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* ── Mode Pembayaran Global ── */}
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <CreditCard
              className="size-5 text-primary shrink-0"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-display text-md font-semibold text-foreground">
                Opsi Mode Pembayaran Aktif
              </h2>
              <p className="text-xs text-muted-foreground">
                Hanya 1 metode aktif yang akan ditampilkan ke publik pada satu
                waktu (PRD 3.3).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opsi 1: Midtrans */}
            <label
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border bg-background p-4 transition-all duration-150",
                paymentMode === "midtrans"
                  ? "border-primary ring-2 ring-ring/30 bg-primary-soft/20"
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
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Payment Gateway (Midtrans)
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-micro text-muted-foreground">
                    <ShieldCheck className="size-3 text-success" />
                    Otomatis
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Peserta membayar via QRIS/Snap Midtrans. Status lunas
                  diverifikasi secara otomatis via webhook tanpa perlu upload
                  bukti transfer.
                </p>
              </div>
            </label>

            {/* Opsi 2: Transfer Bank Manual */}
            <label
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border bg-background p-4 transition-all duration-150",
                paymentMode === "manual_bank"
                  ? "border-primary ring-2 ring-ring/30 bg-primary-soft/20"
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
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Transfer Bank Manual
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 font-mono text-micro text-warning">
                    Verifikasi Panitia
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Peserta mengunggah foto/dokumen bukti transfer ke rekening
                  panitia. Panitia wajib memverifikasi di halaman pendaftaran.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* ── Kelola Rekening Bank Manual ── */}
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Building2
                className="size-5 text-primary shrink-0"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-display text-md font-semibold text-foreground">
                  Daftar Rekening Bank Penerima (Transfer Manual)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tambahkan satu atau lebih rekening bank panitia yang akan
                  muncul di instruksi bayar peserta.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddBank}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring self-start sm:self-auto"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>Tambah Rekening</span>
            </button>
          </div>

          <div className="space-y-4">
            {bankAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                Belum ada rekening bank yang ditambahkan. Klik &quot;Tambah
                Rekening&quot; di atas.
              </p>
            ) : (
              bankAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">
                      Rekening #{idx + 1} {idx === 0 && "(Utama)"}
                    </span>
                    {bankAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBank(idx)}
                        className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                        title="Hapus rekening ini"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-micro font-semibold text-foreground">
                        Nama Bank
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bank Nagari / BRI / BCA"
                        value={acc.bank_name}
                        onChange={(e) =>
                          handleBankChange(idx, "bank_name", e.target.value)
                        }
                        className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-micro font-semibold text-foreground">
                        Nomor Rekening
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2101-0210-9876"
                        value={acc.account_number}
                        onChange={(e) =>
                          handleBankChange(
                            idx,
                            "account_number",
                            e.target.value,
                          )
                        }
                        className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-micro font-semibold text-foreground">
                        Atas Nama (Pemilik)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UKM Robotik PNP"
                        value={acc.account_holder}
                        onChange={(e) =>
                          handleBankChange(
                            idx,
                            "account_holder",
                            e.target.value,
                          )
                        }
                        className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Info PRD 3.3 */}
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
          <Info
            className="size-4 text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p>
            Sesuai PRD 3.3, integrasi Midtrans akan otomatis aktif di publik
            begitu status Midtrans disetujui, tanpa perlu perubahan kode
            program.
          </p>
        </div>

        {/* Sticky Action Footer */}
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
              {isSubmitting ? "Menyimpan..." : "Simpan Metode Pembayaran"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
