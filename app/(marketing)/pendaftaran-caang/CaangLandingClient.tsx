"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  HelpCircleIcon,
  Sparkles,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Cpu,
  Award,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrSettingsData, TimelineEvent } from "@/lib/actions/or-settings";

interface CaangLandingClientProps {
  settings: OrSettingsData | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

export function CaangLandingClient({ settings }: CaangLandingClientProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statusPendaftaran = settings?.status_pendaftaran ?? false;
  const tanggalMulai = settings?.tanggal_mulai
    ? new Date(settings.tanggal_mulai)
    : null;
  const tanggalSelesai = settings?.tanggal_selesai
    ? new Date(settings.tanggal_selesai)
    : null;
  const periodeRecruitment = settings?.periode_recruitment || "2026/2027";

  let state: "coming_soon" | "opening_soon" | "open" | "closed" = "coming_soon";
  let targetDate: Date | null = null;
  let labelText = "Coming Soon";
  let statusBadge = "Pendaftaran Belum Dibuka";

  if (statusPendaftaran && tanggalMulai && tanggalSelesai && now) {
    if (now < tanggalMulai) {
      state = "opening_soon";
      targetDate = tanggalMulai;
      labelText = "Pendaftaran akan dibuka dalam...";
      statusBadge = "Segera Dibuka";
    } else if (now >= tanggalMulai && now < tanggalSelesai) {
      state = "open";
      targetDate = tanggalSelesai;
      labelText = "Pendaftaran akan ditutup dalam...";
      statusBadge = "Pendaftaran Dibuka";
    } else {
      state = "closed";
      labelText = "Pendaftaran telah ditutup";
      statusBadge = "Pendaftaran Ditutup";
    }
  }

  function calculateTimeLeft(target: Date | null, current: Date | null): TimeLeft {
    if (!target || !current) return { days: 0, hours: 0, minutes: 0 };
    const diff = target.getTime() - current.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
    };
  }

  const timeLeft = calculateTimeLeft(targetDate, now);

  const formatDateStr = (d: Date | null) => {
    if (!d) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  };

  // Fallback timeline if database timeline is empty
  const defaultTimeline: TimelineEvent[] = [
    {
      title: "Pendaftaran Online",
      start_date: tanggalMulai ? tanggalMulai.toISOString() : "2026-09-01",
      end_date: tanggalSelesai ? tanggalSelesai.toISOString() : "2026-09-20",
      description: "Pengisian form pendaftaran & pengunggahan berkas administrasi via web resmi.",
    },
    {
      title: "Seleksi Administrasi & Berkas",
      start_date: "2026-09-21",
      end_date: "2026-09-25",
      description: "Verifikasi kelengkapan dokumen calon anggota oleh tim panitia pendaftaran.",
    },
    {
      title: "Wawancara & Clinical Skill Test",
      start_date: "2026-09-28",
      end_date: "2026-10-02",
      description: "Sesi interview motivasi, minat divisi (Mekanik/Elektronika/Programming), serta tes dasar.",
    },
    {
      title: "Magang / Training BootCamp",
      start_date: "2026-10-05",
      end_date: "2026-11-15",
      description: "Pengenalan riset robot, workshop teknis divisi, piket laboratorium, dan pembuatan miniproject.",
    },
    {
      title: "Pelantikan Anggota Resmi",
      start_date: "2026-11-20",
      end_date: "2026-11-20",
      description: "Pengumuman kelulusan akhir dan penyerahan SK Pelantikan Anggota Muda UKM Robotik PNP.",
    },
  ];

  const timelineList = settings?.timeline && settings.timeline.length > 0
    ? settings.timeline
    : defaultTimeline;

  const faqs = [
    {
      question: "Siapa saja yang boleh mendaftar calon anggota UKM Robotik PNP?",
      answer: "Seluruh mahasiswa aktif Politeknik Negeri Padang (PNP) untuk tingkat D3 maksimal semester 1 dan untuk tingkat D4 maksimal semester 3 dari seluruh jurusan.",
    },
    {
      question: "Apakah harus sudah punya keahlian robotika/koding sebelumnya?",
      answer: "Tidak wajib! Yang paling penting adalah rasa ingin tahu yang tinggi, komitmen, dan semangat belajar. Kamu akan dibimbing dari dasar saat masa magang dan training.",
    },
    {
      question: "Apa saja divisi yang bisa saya pilih di UKM Robotik?",
      answer: "Terdapat divisi Kontes Robot Indonesia (KRI) seperti KRAI (Robot Beroda), KRSBI-H (Robot Sepakbola Humanoid), KRSBI-B (Robot Sepakbola Beroda), KRSTI (Robot Seni Tari), KRSRI (Robot SAR).",
    },
    {
      question: "Bagaimana alur pendaftarannya?",
      answer: "Buat akun pendaftaran di web ini, isi biodata diri & data akademik, serta unggah dokumen pendukung seperti KTM & pasfoto.",
    },
    {
      question: "Apakah pendaftaran dipungut biaya?",
      answer: settings?.biaya_pendaftaran && settings.biaya_pendaftaran > 0
        ? `Biaya pendaftaran adalah sebesar Rp ${settings.biaya_pendaftaran.toLocaleString("id-ID")} untuk mendukung fasilitas seleksi dan kit magang.`
        : "Pendaftaran calon anggota UKM Robotik PNP bersifat GRATIS tanpa biaya pendaftaran.",
    },
  ];

  return (
    <div className="w-full bg-background text-foreground min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl space-y-16">

        {/* Header Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span>Open Recruitment Periode {periodeRecruitment}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display leading-tight">
            Bergabunglah Menjadi Bagian dari <span className="text-primary">UKM Robotik PNP</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Wadah resmi mahasiswa Politeknik Negeri Padang untuk mengembangkan potensi rekayasa robotika, sistem cerdas, mekatronika, dan bertanding di tingkat nasional.
          </p>
        </div>

        {/* Status & Countdown Banner Card */}
        <div className="bg-card border border-border rounded-2xl shadow-md p-6 sm:p-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-secondary text-secondary-foreground border border-border">
                {statusBadge}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                Status Pendaftaran Calon Anggota
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                {state === "open"
                  ? "Pendaftaran online sedang dibuka! Segera lengkapi data registrasi kamu sebelum batas waktu berakhir."
                  : state === "opening_soon"
                  ? "Pendaftaran akan segera dibuka sesuai jadwal berikut. Persiapkan berkas pendaftaranmu!"
                  : state === "closed"
                  ? "Pendaftaran periode ini telah resmi ditutup."
                  : "Jadwal pendaftaran resmi akan segera diumumkan."}
              </p>

              {(tanggalMulai || tanggalSelesai) && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground pt-1">
                  {tanggalMulai && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Mulai: <strong className="text-foreground">{formatDateStr(tanggalMulai)}</strong></span>
                    </div>
                  )}
                  {tanggalSelesai && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-accent" />
                      <span>Selesai: <strong className="text-foreground">{formatDateStr(tanggalSelesai)}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Countdown / Status Visual */}
            <div className="w-full md:w-auto flex flex-col items-center min-w-[260px] sm:min-w-[320px] bg-surface border border-border/80 rounded-xl p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {labelText}
              </span>

              {state === "coming_soon" && (
                <div className="py-4 px-6 rounded-lg bg-card border border-dashed border-border text-center w-full">
                  <span className="text-2xl font-bold tracking-widest text-primary font-display">
                    COMING SOON
                  </span>
                </div>
              )}

              {state === "closed" && (
                <div className="py-4 px-6 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-center w-full">
                  <span className="text-lg font-bold">Ditutup</span>
                </div>
              )}

              {(state === "opening_soon" || state === "open") && (
                <div className="grid grid-cols-3 gap-3 w-full">
                  <div className="flex flex-col items-center bg-card border border-border p-3 rounded-lg">
                    <span className="text-2xl font-bold font-mono">{String(timeLeft.days).padStart(2, "0")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Hari</span>
                  </div>
                  <div className="flex flex-col items-center bg-card border border-border p-3 rounded-lg">
                    <span className="text-2xl font-bold font-mono">{String(timeLeft.hours).padStart(2, "0")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Jam</span>
                  </div>
                  <div className="flex flex-col items-center bg-card border border-border p-3 rounded-lg">
                    <span className="text-2xl font-bold font-mono text-primary animate-pulse">{String(timeLeft.minutes).padStart(2, "0")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Menit</span>
                  </div>
                </div>
              )}

              <div className="mt-6 w-full">
                <Button
                  asChild
                  size="lg"
                  className="w-full gap-2 font-medium"
                  disabled={state === "closed"}
                >
                  <Link href={state === "open" ? "/register" : "# syarat"}>
                    <UserPlus className="w-4 h-4" />
                    {state === "open" ? "Daftar Sekarang" : "Lihat Persyaratan"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements & Criteria */}
        <div id="syarat" className="space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Syarat & Kriteria Pendaftaran</h2>
            <p className="text-muted-foreground text-sm">Persyaratan utama calon anggota baru UKM Robotik PNP</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Mahasiswa Aktif PNP</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tercatat sebagai mahasiswa aktif Politeknik Negeri Padang (Tingkat D3 maksimal semester 1 dan Tingkat D4 maksimal semester 3 seluruh jurusan).
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Minat Riset & Teknologi</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Memiliki ketertarikan tinggi terhadap ilmu mekanik, elektronika, embedded system, atau pemograman robot.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Komitmen & Kerjasama Tim</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Siap mengikuti pelatihan, alur magang, pembekalan workshop, mini project, dan memiliki disiplin organisasi.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Alur & Timeline Pendaftaran</h2>
            <p className="text-muted-foreground text-sm">Tahapan kegiatan dari pendaftaran hingga pengangkatan anggota</p>
          </div>

          <div className="relative border-l-2 border-border ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-8">
            {timelineList.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Node Icon */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>

                <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-2 shadow-xs hover:border-primary/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary uppercase tracking-wider font-mono">Tahap {idx + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Pertanyaan Sering Diajukan (FAQ)</h2>
            <p className="text-muted-foreground text-sm">Temukan jawaban atas pertanyaan seputar pendaftaran</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-6 space-y-2">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Card */}
        <div className="bg-gradient-to-r from-primary/10 via-surface to-accent/10 border border-border rounded-2xl p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-display">
            Siap Ukir Prestasi Robotika Bersama Kami?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Jangan lewatkan kesempatan menjadi inovator muda teknologi Politeknik Negeri Padang. Daftarkan dirimu sebelum batas waktu habis!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto font-medium gap-2 shadow-sm"
              disabled={state === "closed"}
            >
              <Link href={state === "open" ? "/register" : "#"}>
                <UserPlus className="w-4 h-4" />
                {state === "open" ? "Daftar Sekarang" : "Pendaftaran Belum Dibuka"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-medium gap-2"
            >
              <Link href="/divisi">
                <span>Lihat Divisi Robot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
