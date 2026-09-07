"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  getRegistrationByAccessTokenAction,
  refreshQrisChargeAction,
} from "@/lib/actions/event-registration";
import type { EventRegistration } from "@/types/event-registration";
import {
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  RefreshCw,
  AlertTriangle,
  Info,
} from "lucide-react";

function formatRupiah(amount: number): string {
  if (amount <= 0) return "GRATIS";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** expiry_time Midtrans "YYYY-MM-DD HH:mm:ss" (WIB) → epoch ms. */
function parseMidtransExpiry(value: string | null): number | null {
  if (!value) return null;
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}+07:00`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m <= 0) return `${s} dtk`;
  return `${m} mnt ${String(s).padStart(2, "0")} dtk`;
}

export function QrisPaymentView({
  initialRegistration,
}: {
  initialRegistration: EventRegistration;
}) {
  const [reg, setReg] = useState<EventRegistration>(initialRegistration);
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const tickRef = useRef(0);

  // Polling status tiap 5 detik selama pending (sinkronisasi aktif ke Midtrans).
  // Lunas → langsung arahkan ke halaman E-Tiket.
  useEffect(() => {
    if (reg.payment_status !== "pending") return;
    let cancelled = false;
    const id = setInterval(async () => {
      if (cancelled) return;
      setNow(Date.now());
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
        // Abaikan kegagalan sesaat, coba lagi pada interval berikut.
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [reg.payment_status, reg.access_token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await refreshQrisChargeAction(reg.access_token);
      if (!res.success) {
        setRefreshError(res.error || "Gagal membuat QR baru.");
        return;
      }
      const fresh = await getRegistrationByAccessTokenAction(reg.access_token);
      if (fresh.success && fresh.data) {
        tickRef.current = 0;
        setReg(fresh.data);
      }
    } catch (err: unknown) {
      setRefreshError((err as Error).message || "Gagal membuat QR baru.");
    } finally {
      setRefreshing(false);
    }
  };

  // ---- Status LUNAS ----
  if (reg.payment_status === "paid") {
    return (
      <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-4">
        <div className="inline-flex p-3 bg-success/15 text-success rounded-full">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-balance">Pembayaran Lunas</h2>
        <p className="text-sm text-muted-foreground">
          Pembayaran tim <strong>{reg.team_name}</strong> telah dikonfirmasi.
          Mengalihkan ke E-Tiket…
        </p>
        <a
          href={`/mrc/tiket/${reg.access_token}`}
          className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-md transition-colors"
        >
          Buka E-Tiket Sekarang
        </a>
      </div>
    );
  }

  // ---- Pendaftaran GRATIS (pengaman, normalnya sudah auto-paid) ----
  if (reg.total_amount <= 0) {
    return (
      <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-3">
        <div className="inline-flex p-3 bg-success/15 text-success rounded-full">
          <Info className="w-8 h-8" />
        </div>
        <p className="text-sm text-muted-foreground">
          Pendaftaran ini <strong>GRATIS</strong>, tidak ada pembayaran yang
          diperlukan.
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

  // ---- QR KEDALUWARSA / GAGAL ----
  if (reg.payment_status === "expired" || reg.payment_status === "failed") {
    return (
      <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-4">
        <div className="inline-flex p-3 bg-warning/15 text-warning rounded-full">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-balance">
          {reg.payment_status === "expired"
            ? "QR Kedaluwarsa"
            : "Pembayaran Gagal"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Kode QR sebelumnya sudah tidak berlaku. Buat kode QR baru dengan
          nominal yang sama (
          <span className="font-mono font-bold">
            {formatRupiah(reg.total_amount)}
          </span>
          ), lalu pindai ulang.
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
                <Loader2 className="w-4 h-4 animate-spin" /> Membuat QR Baru…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Buat QR Baru
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

  const expiryMs = parseMidtransExpiry(reg.midtrans_qr_expiry);
  const remaining = expiryMs !== null ? expiryMs - now : null;

  // ---- QR BELUM TERSEDIA (kunci Midtrans belum dikonfigurasi) ----
  if (!reg.midtrans_qr_url) {
    return (
      <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-3">
        <div className="inline-flex p-3 bg-warning/15 text-warning rounded-full">
          <QrCode className="w-8 h-8" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          QR pembayaran belum dapat dibuat otomatis (gateway dalam mode
          pengembangan). Selesaikan via bukti transfer manual di halaman E-Tiket
          — panitia akan memverifikasi.
        </p>
        <a
          href={`/mrc/tiket/${reg.access_token}`}
          className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-md transition-colors"
        >
          Buka E-Tiket & Upload Bukti Manual
        </a>
      </div>
    );
  }

  // ---- QR AKTIF (pending) ----
  return (
    <div className="bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      <div className="p-6 sm:p-8 space-y-5 text-center">
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            Nominal Pembayaran
          </p>
          <p className="font-mono text-3xl font-extrabold text-foreground tracking-tight">
            {formatRupiah(reg.total_amount)}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-1">
            Order: {reg.midtrans_order_id || "-"} • {reg.registration_code}
          </p>
        </div>

        <div className="inline-block p-4 bg-background border border-border rounded-lg">
          <Image
            src={reg.midtrans_qr_url}
            alt={`Kode QRIS pembayaran ${formatRupiah(reg.total_amount)} tim ${reg.team_name}`}
            width={280}
            height={280}
            className="w-60 h-60 sm:w-70 sm:h-70 object-contain"
            priority
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/30">
          <Clock className="w-4 h-4" />
          {remaining !== null && remaining > 0 ? (
            <span>Berlaku {formatCountdown(remaining)} lagi</span>
          ) : (
            <span>Menunggu status pembayaran…</span>
          )}
        </div>

        <ol className="text-left text-xs text-muted-foreground space-y-2 max-w-sm mx-auto bg-muted/40 border border-border rounded-md p-4">
          <li>
            <strong className="text-foreground">1.</strong> Buka aplikasi apa
            pun (GoPay, OVO, DANA, BCA Mobile, BRImo, Livin&apos;).
          </li>
          <li>
            <strong className="text-foreground">2.</strong> Pilih bayar pakai
            QRIS / pindai QR, arahkan ke kode di atas.
          </li>
          <li>
            <strong className="text-foreground">3.</strong> Pastikan nominal{" "}
            <span className="font-mono font-bold">
              {formatRupiah(reg.total_amount)}
            </span>{" "}
            atas nama tim <strong>{reg.team_name}</strong>, lalu konfirmasi.
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
