"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  getRegistrationByAccessTokenAction,
  refreshQrisChargeAction,
  submitManualPaymentProofAction,
  uploadPaymentProofAction,
} from "@/lib/actions/event-registration";
import type { EventRegistration, EventSettings, BankAccount } from "@/types/event-registration";
import {
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  RefreshCw,
  AlertTriangle,
  Info,
  Building2,
  Upload,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

function formatRupiah(amount: number): string {
  if (amount <= 0) return "GRATIS";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QrisPaymentView({
  initialRegistration,
  eventSettings,
}: {
  initialRegistration: EventRegistration;
  eventSettings?: EventSettings | null;
}) {
  const [reg, setReg] = useState<EventRegistration>(initialRegistration);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // State Manual Payment Upload
  const [proofUrl, setProofUrl] = useState(reg.manual_payment_proof_url || "");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadProofError, setUploadProofError] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [copiedBankIndex, setCopiedBankIndex] = useState<number | null>(null);

  const tickRef = useRef(0);

  const isManualBankMode = eventSettings?.payment_mode === "manual_bank";

  // Build List of Bank Accounts
  const availableBankAccounts: BankAccount[] = (() => {
    if (eventSettings?.bank_accounts && eventSettings.bank_accounts.length > 0) {
      return eventSettings.bank_accounts;
    }
    if (
      eventSettings?.bank_name ||
      eventSettings?.bank_account_number ||
      eventSettings?.bank_account_holder
    ) {
      return [
        {
          bank_name: eventSettings.bank_name || "Bank Nagari / BNI",
          account_number: eventSettings.bank_account_number || "",
          account_holder: eventSettings.bank_account_holder || "UKM Robotik PNP",
        },
      ];
    }
    return [
      {
        bank_name: "Bank Nagari / BNI",
        account_number: "1234567890",
        account_holder: "UKM Robotik PNP",
      },
    ];
  })();

  // Load Midtrans Snap script bila menggunakan mode midtrans
  useEffect(() => {
    if (isManualBankMode) return;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    const isProduction =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    if (!document.querySelector(`script[src="${snapUrl}"]`)) {
      const script = document.createElement("script");
      script.src = snapUrl;
      if (clientKey) {
        script.setAttribute("data-client-key", clientKey);
      }
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isManualBankMode]);

  // Polling status tiap 5 detik selama pending / pending_verification / unpaid
  useEffect(() => {
    if (reg.payment_status === "paid") return;
    let cancelled = false;
    const id = setInterval(async () => {
      if (cancelled) return;
      tickRef.current += 1;
      if (tickRef.current % 5 !== 0) return;
      try {
        const res = await getRegistrationByAccessTokenAction(reg.access_token);
        if (!cancelled && res.success && res.data) {
          setReg(res.data);
          if (res.data.payment_status === "paid") {
            window.location.href = `/mrc/tiket/${res.data.access_token}`;
          }
        }
      } catch {
        // Abaikan kegagalan sesaat
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [reg.payment_status, reg.access_token]);

  const handleOpenSnapModal = () => {
    if (!reg.midtrans_snap_token) {
      handleRefresh();
      return;
    }

    if (window.snap) {
      window.snap.pay(reg.midtrans_snap_token, {
        onSuccess: () => {
          window.location.href = `/mrc/tiket/${reg.access_token}`;
        },
        onPending: () => {
          // Status pending, polling akan mengecek
        },
        onError: () => {
          setRefreshError("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          // User menutup popup modal
        },
      });
    } else {
      setRefreshError(
        "Gagal memuat sistem pembayaran Midtrans. Coba muat ulang halaman.",
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await refreshQrisChargeAction(reg.access_token);
      if (!res.success) {
        setRefreshError(res.error || "Gagal membuat sesi pembayaran baru.");
        return;
      }
      const fresh = await getRegistrationByAccessTokenAction(reg.access_token);
      if (fresh.success && fresh.data) {
        tickRef.current = 0;
        setReg(fresh.data);
        if (fresh.data.midtrans_snap_token && window.snap) {
          window.snap.pay(fresh.data.midtrans_snap_token, {
            onSuccess: () => {
              window.location.href = `/mrc/tiket/${fresh.data.access_token}`;
            },
            onError: () => {
              setRefreshError("Pembayaran gagal. Silakan coba lagi.");
            },
          });
        }
      }
    } catch (err: unknown) {
      setRefreshError(
        (err as Error).message || "Gagal membuat sesi pembayaran baru.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleProofFileUpload = async (file: File) => {
    setIsUploadingProof(true);
    setUploadProofError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadPaymentProofAction(formData);
      if (res.success) {
        setProofUrl(res.data);
      } else {
        setUploadProofError(res.error || "Gagal mengunggah bukti pembayaran.");
      }
    } catch (err: unknown) {
      setUploadProofError((err as Error).message || "Gagal memproses file.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) {
      setUploadProofError("Silakan upload gambar bukti transfer terlebih dahulu.");
      return;
    }

    setIsSubmittingProof(true);
    setUploadProofError(null);

    const res = await submitManualPaymentProofAction(reg.id, proofUrl);
    setIsSubmittingProof(false);

    if (res.success) {
      const fresh = await getRegistrationByAccessTokenAction(reg.access_token);
      if (fresh.success && fresh.data) {
        setReg(fresh.data);
      }
    } else {
      setUploadProofError(res.error || "Gagal mengirimkan bukti pembayaran.");
    }
  };

  const copyBankNumber = (num: string, index: number) => {
    navigator.clipboard.writeText(num);
    setCopiedBankIndex(index);
    setTimeout(() => setCopiedBankIndex(null), 2000);
  };

  // ---- Status LUNAS ----
  if (reg.payment_status === "paid") {
    return (
      <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-4">
        <div className="inline-flex p-3 bg-success/15 text-success rounded-full">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-balance">Pembayaran Terverifikasi & Lunas!</h2>
        <p className="text-sm text-muted-foreground">
          Pembayaran pendaftaran tim <strong>{reg.team_name}</strong> telah dikonfirmasi oleh panitia.
        </p>

        {reg.category?.whatsapp_group_url && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg max-w-md mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Grup WhatsApp Official {reg.category.name}
            </span>
            <p className="text-xs text-emerald-700">
              Silakan bergabung ke grup WhatsApp untuk mendapatkan informasi teknis perlombaan:
            </p>
            <a
              href={reg.category.whatsapp_group_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md transition-colors"
            >
              Bergabung ke Grup WhatsApp
            </a>
          </div>
        )}

        <div className="pt-2">
          <a
            href={`/mrc/tiket/${reg.access_token}`}
            className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-md transition-colors"
          >
            Buka E-Tiket & QR Kokarde Sekarang
          </a>
        </div>
      </div>
    );
  }

  // ---- Pendaftaran GRATIS ----
  if (reg.total_amount <= 0) {
    return (
      <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-3">
        <div className="inline-flex p-3 bg-success/15 text-success rounded-full">
          <Info className="w-8 h-8" />
        </div>
        <p className="text-sm text-muted-foreground">
          Pendaftaran ini <strong>GRATIS</strong>, tidak ada pembayaran yang diperlukan.
        </p>
        <a
          href={`/mrc/tiket/${reg.access_token}`}
          className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-md transition-colors"
        >
          Buka E-Tiket
        </a>
      </div>
    );
  }

  // ---- OPSI 2: TRANSFER BANK MANUAL VIEW ----
  if (isManualBankMode) {
    const isPendingVerification = reg.payment_status === "pending_verification";
    const isRejected = reg.payment_status === "rejected";

    return (
      <div className="bg-card rounded-xl border border-border shadow-soft p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Total Biaya Pendaftaran</p>
          <p className="font-mono text-3xl font-extrabold text-foreground tracking-tight">
            {formatRupiah(reg.total_amount)}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            Kode: {reg.registration_code} • Tim {reg.team_name}
          </p>
        </div>

        {/* STATUS BADGE SUMMARY */}
        {isPendingVerification && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
            <div className="inline-flex p-2 bg-amber-100 text-amber-700 rounded-full">
              <Clock className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-sm font-bold text-amber-900">
              Menunggu Verifikasi Pembayaran Admin
            </h3>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              Bukti transfer bank telah berhasil dikirim. Panitia sedang melakukan pengecekan mutasi rekening. Anda akan menerima email begitu pembayaran disetujui.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
            <div className="inline-flex p-2 bg-rose-100 text-rose-700 rounded-full">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-rose-900">
              Bukti Pembayaran Ditolak Admin
            </h3>
            {reg.rejection_reason && (
              <p className="text-xs font-semibold text-rose-800 bg-rose-100/80 p-2.5 rounded-lg max-w-md mx-auto">
                Alasan: "{reg.rejection_reason}"
              </p>
            )}
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              Silakan lakukan transfer sesuai nominal dan unggah ulang gambar bukti transfer yang benar di bawah ini.
            </p>
          </div>
        )}

        {/* DETAILS DAFTAR REKENING BANK PANITIA */}
        <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Opsi Rekening Bank Tujuan Transfer
          </h3>
          <p className="text-xs text-muted-foreground">
            Anda dapat mentransfer biaya pendaftaran ke salah satu rekening bank berikut:
          </p>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {availableBankAccounts.map((acc, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-background rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    {acc.bank_name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <strong className="text-foreground font-mono text-base tracking-wide">
                      {acc.account_number}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyBankNumber(acc.account_number, idx)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Salin Nomor Rekening"
                    >
                      {copiedBankIndex === idx ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    a.n {acc.account_holder}
                  </span>
                </div>

                <div className="text-right sm:text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold">
                    Pilihan Rekening #{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM UPLOAD BUKTI TRANSFER */}
        {(!isPendingVerification || isRejected) && (
          <form onSubmit={handleSubmitProof} className="space-y-4 pt-2 border-t border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Unggah Bukti Pembayaran Transfer Bank
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Format gambar JPG, PNG, WebP, HEIC (Maksimal 5MB).
              </p>
            </div>

            {uploadProofError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive">
                {uploadProofError}
              </div>
            )}

            {proofUrl ? (
              <div className="space-y-3">
                <div className="relative border border-border rounded-lg overflow-hidden bg-muted aspect-video max-w-sm mx-auto flex items-center justify-center">
                  <Image
                    src={proofUrl}
                    alt="Bukti Transfer"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProofUrl("")}
                    className="text-xs text-muted-foreground hover:underline hover:text-foreground"
                  >
                    Ganti Gambar Bukti
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  disabled={isUploadingProof}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProofFileUpload(file);
                  }}
                  className="hidden"
                  id="payment-proof-input"
                />
                <label
                  htmlFor="payment-proof-input"
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-input rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors text-center"
                >
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        Mengompres & Uploading Bukti...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground">
                        Klik untuk Pilih Foto / Screenshot Bukti Transfer
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Pastikan tanggal, nominal, & nama pengirim terlihat jelas.
                      </span>
                    </>
                  )}
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingProof || !proofUrl || isUploadingProof}
              className="w-full min-h-[44px] bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmittingProof ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengirimkan...
                </>
              ) : (
                "Kirim Bukti Pembayaran untuk Verifikasi"
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <a
            href={`/mrc/tiket/${reg.access_token}`}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Lihat Status E-Tiket Pendaftaran Tim
          </a>
        </div>
      </div>
    );
  }

  // ---- OPSI 1: KEDALUWARSA / GAGAL (Midtrans Mode) ----
  if (reg.payment_status === "expired" || reg.payment_status === "failed") {
    return (
      <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-4">
        <div className="inline-flex p-3 bg-warning/15 text-warning rounded-full">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-balance">
          {reg.payment_status === "expired"
            ? "Sesi Pembayaran Kedaluwarsa"
            : "Pembayaran Gagal"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Sesi pembayaran sebelumnya sudah tidak berlaku. Klik tombol di bawah untuk membuka pembayaran baru dengan nominal yang sama (
          <span className="font-mono font-bold">{formatRupiah(reg.total_amount)}</span>
          ).
        </p>
        {refreshError && (
          <p className="text-xs text-destructive" role="alert">
            {refreshError}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-md transition-colors disabled:opacity-60"
          >
            {refreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat Sesi Baru…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Bayar Sekarang
              </>
            )}
          </button>
          <a
            href={`/mrc/tiket/${reg.access_token}`}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-secondary hover:bg-muted text-secondary-foreground border border-border text-sm font-semibold rounded-md transition-colors"
          >
            Kembali ke E-Tiket
          </a>
        </div>
      </div>
    );
  }

  // ---- OPSI 1: PEMBAYARAN MIDTRANS AKTIF (pending) ----
  return (
    <div className="bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6 text-center">
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            Total Biaya Pendaftaran
          </p>
          <p className="font-mono text-3xl font-extrabold text-foreground tracking-tight">
            {formatRupiah(reg.total_amount)}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-1">
            Order: {reg.midtrans_order_id || "-"} • {reg.registration_code}
          </p>
        </div>

        {refreshError && (
          <p
            className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md"
            role="alert"
          >
            {refreshError}
          </p>
        )}

        <div className="space-y-3 max-w-sm mx-auto">
          <button
            type="button"
            onClick={handleOpenSnapModal}
            disabled={refreshing}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground text-base font-bold rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {refreshing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Mempersiapkan
                Pembayaran…
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" /> Bayar via Midtrans (Pop-up Modal)
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground">
            Dukung pembayaran QRIS (GoPay, ShopeePay, OVO, DANA, Mobile
            Banking), Transfer Bank (VA), & E-Wallet.
          </p>
        </div>

        <ol className="text-left text-xs text-muted-foreground space-y-2 max-w-sm mx-auto bg-muted/40 border border-border rounded-md p-4">
          <li>
            <strong className="text-foreground">1.</strong> Klik tombol{" "}
            <strong>Bayar via Midtrans</strong> di atas.
          </li>
          <li>
            <strong className="text-foreground">2.</strong> Pilih metode
            pembayaran yang Anda inginkan (QRIS, Bank Transfer, E-Wallet) pada
            pop-up modal Midtrans.
          </li>
          <li>
            <strong className="text-foreground">3.</strong> Selesaikan
            pembayaran sesuai instruksi pada layar modal.
          </li>
          <li>
            <strong className="text-foreground">4.</strong> Halaman ini otomatis
            beralih ke E-Tiket setelah lunas.
          </li>
        </ol>

        <p className="text-[11px] text-muted-foreground">
          Mengalami kendala? Gunakan jalur bukti transfer manual di{" "}
          <a
            href={`/mrc/tiket/${reg.access_token}`}
            className="text-primary hover:underline font-medium"
          >
            halaman E-Tiket
          </a>
          .
        </p>
      </div>
    </div>
  );
}
