"use client";

import { useState } from "react";
import Script from "next/script";
import { toast } from "sonner";
import {
  Bot,
  CheckCircle2,
  Cpu,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

interface CategoryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  badge: string;
  icon: typeof Cpu;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: "line-follower-senior",
    name: "Line Follower Senior - Batch Review",
    description: "Kategori Line Follower tingkat Mahasiswa / Umum.",
    price: 100000,
    badge: "Senior",
    icon: Zap,
  },
  {
    id: "line-follower-junior",
    name: "Line Follower Junior - Batch Review",
    description: "Kategori Line Follower tingkat Pelajar SMA/SMK Sederajat.",
    price: 100000,
    badge: "Junior",
    icon: Zap,
  },
  {
    id: "sumo-bot-senior",
    name: "Sumo Bot Senior - Batch Review",
    description:
      "Pertarungan Sumo Robot 3kg Autonomous tingkat Perguruan Tinggi.",
    price: 100000,
    badge: "Senior",
    icon: Cpu,
  },
  {
    id: "sumo-bot-junior",
    name: "Sumo Bot Junior - Batch Review",
    description: "Pertarungan Sumo Robot 1kg RC/Autonomous tingkat Sekolah.",
    price: 100000,
    badge: "Junior",
    icon: Cpu,
  },
  {
    id: "soccer-bot-senior",
    name: "Soccer Bot Senior - Batch Review",
    description: "Kompetisi Robot Sepak Bola Beroda tingkat Mahasiswa.",
    price: 100000,
    badge: "Senior",
    icon: Bot,
  },
  {
    id: "soccer-bot-junior",
    name: "Soccer Bot Junior - Batch Review",
    description: "Kompetisi Robot Sepak Bola Beroda tingkat Pelajar.",
    price: 100000,
    badge: "Junior",
    icon: Bot,
  },
];

export default function MidtransReviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>(
    CATEGORIES[0],
  );
  const [teamName, setTeamName] = useState("Tim Robovision Alpha");
  const [leaderName, setLeaderName] = useState("Budi Santoso");
  const [email, setEmail] = useState("reviewer.midtrans@robotik-pnp.com");
  const [whatsapp, setWhatsapp] = useState("081234567890");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName || !leaderName || !email || !whatsapp) {
      toast.error("Mohon lengkapi seluruh field form simulasi.");
      return;
    }

    setIsLoading(true);
    setPaymentStatus("idle");

    try {
      const response = await fetch("/api/review-midtrans/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_name: teamName,
          leader_name: leaderName,
          email,
          whatsapp,
          category: selectedCategory.name,
          amount: selectedCategory.price,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Gagal membuat transaksi checkout simulasi.",
        );
      }

      const { snap_token, order_id } = result.data;
      setLastOrderId(order_id);

      if (!window.snap) {
        toast.error(
          "Script Midtrans Snap belum selesai dimuat. Silakan coba lagi.",
        );
        setIsLoading(false);
        return;
      }

      window.snap.pay(snap_token, {
        onSuccess: (res) => {
          console.log("[Midtrans Review Success]:", res);
          setPaymentStatus("success");
          toast.success(
            "Pembayaran Simulasi Sandbox Berhasil! (Status: Settlement)",
          );
          setIsLoading(false);
        },
        onPending: (res) => {
          console.log("[Midtrans Review Pending]:", res);
          setPaymentStatus("pending");
          toast.info("Pembayaran Simulasi Tertunda (Pending).");
          setIsLoading(false);
        },
        onError: (res) => {
          console.error("[Midtrans Review Error]:", res);
          setPaymentStatus("error");
          toast.error("Pembayaran Simulasi Gagal / Dibatalkan.");
          setIsLoading(false);
        },
        onClose: () => {
          toast.warning("Pop-up pembayaran Snap ditutup oleh pengguna.");
          setIsLoading(false);
        },
      });
    } catch (err: unknown) {
      console.error("Checkout submission error:", err);
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan sistem";
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground pt-16 sm:pt-20">
      {/* Snap JS Script Loader for Midtrans Sandbox */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      {/* Top Banner Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-16 sm:top-18 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-xs">
              <ShieldCheck className="w-6 h-6 text-accent-strong" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg text-foreground leading-tight">
                  Midtrans Sandbox Verification Portal
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warning-soft text-warning border border-warning/20">
                  <Sparkles className="w-3 h-3" /> Sandbox Mode
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                UKM Robotik PNP — Minangkabau Robot Contest Verification Gateway
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Hidden Review Route
            </span>
            <code className="text-[11px] font-mono text-primary bg-secondary px-2 py-0.5 rounded border border-border">
              /review-midtrans
            </code>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Verification Info Alert Box */}
        <div className="p-5 rounded-2xl bg-warning-soft/80 border border-warning/30 text-foreground flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-xs">
          <div className="space-y-1">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2 text-warning">
              <ShieldCheck className="w-4 h-4 text-warning" /> Halaman Khusus
              Peninjauan Verifikasi Midtrans
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
              Halaman ini disediakan khusus untuk Tim Verifikator / Business
              Reviewer Midtrans guna menguji alur registrasi dan integrasi Snap
              Payment Gateway (Sandbox Mode) dengan harga fixed Rp100.000.
              Halaman pendaftaran utama Minangkabau Robot Contest tetap ditutup
              sesuai jadwal rilis resmi.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-card border border-warning/30 text-foreground shadow-2xs">
              <CreditCard className="w-3.5 h-3.5 text-accent-strong" /> Fixed
              Fee: Rp100.000
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Category Cards Selector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-foreground text-base">
                  1. Pilih Kategori Lomba Simulasi
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pilih salah satu divisi perlombaan untuk dites di lingkungan
                  Snap Sandbox
                </p>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                6 Kategori
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory.id === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-card border-primary ring-2 ring-primary/20 shadow-sm"
                        : "bg-card border-border hover:border-muted-foreground/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          cat.badge === "Senior"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-warning-soft text-warning border border-warning/20"
                        }`}
                      >
                        {cat.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-semibold text-foreground text-xs line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {cat.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between mt-auto">
                      <span className="text-xs text-muted-foreground">
                        Biaya Review:
                      </span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        Rp {cat.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Registration & Checkout Form */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border rounded-2xl shadow-xs p-6 space-y-6 sticky top-36">
              <div>
                <h2 className="font-display font-bold text-foreground text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> 2. Form Input
                  Peserta Simulasi
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Isi data simulasi pendaftaran untuk dikirimkan ke Midtrans
                  Snap.
                </p>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                {/* Selected Category Lock Display */}
                <div className="p-3 bg-secondary rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Kategori Terpilih
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground line-clamp-1">
                      {selectedCategory.name}
                    </span>
                    <span className="font-mono font-bold text-xs text-primary shrink-0">
                      Rp {selectedCategory.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Nama Tim
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="Contoh: Tim Robovision Alpha"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Nama Ketua / Pendaftar
                  </label>
                  <input
                    type="text"
                    required
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="reviewer@domain.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="081234567890"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        <span>Menyiapkan Pop-up Snap...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-accent-strong" />
                        <span>Uji Coba Pembayaran (Sandbox)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Status Box Callout */}
              {paymentStatus !== "idle" && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    paymentStatus === "success"
                      ? "bg-success-soft border-success/30 text-success"
                      : paymentStatus === "pending"
                        ? "bg-warning-soft border-warning/30 text-warning"
                        : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Status Callback:{" "}
                      {paymentStatus === "success"
                        ? "Settlement (Berhasil)"
                        : paymentStatus === "pending"
                          ? "Pending (Menunggu)"
                          : "Gagal / Cancel"}
                    </span>
                  </div>
                  {lastOrderId && (
                    <p className="text-[11px] font-mono opacity-90">
                      Order ID: {lastOrderId}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
