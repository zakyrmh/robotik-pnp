/**
 * CaangDashboard — Server Component utama dashboard calon anggota.
 *
 * Menampilkan konten berbeda berdasarkan status registrasi:
 * 1. draft/submitted/revision → Form pendaftaran (Registration Wizard)
 * 2. rejected → Pesan penolakan
 * 3. accepted/training/interview_1/project_phase/interview_2/graduated → Dashboard progres seleksi
 */

import {
  Bot,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  ExternalLink,
  CalendarDays,
  ClipboardList,
  Users,
  MessageCircle,
} from "lucide-react";
import { getMyRegistration, getStudyProgramOptions } from "@/app/actions/or.action";
import {
  getPipelineSteps,
  getCommunityLinks,
} from "@/app/actions/or-settings.action";
import type { PipelineStep, CommunityLinks } from "@/app/actions/or-settings.action";
import { CaangRegistrationWizard } from "@/components/or/caang-registration-wizard";
import { OR_REGISTRATION_STATUS_LABELS } from "@/lib/db/schema/or";
import type { OrRegistrationStatus } from "@/lib/db/schema/or";

// ═══════════════════════════════════════════════
// Status groups
// ═══════════════════════════════════════════════

const REGISTRATION_PHASE_STATUSES = ["draft", "submitted", "revision"];
const ACCEPTED_PIPELINE_STATUSES = [
  "accepted",
  "training",
  "interview_1",
  "project_phase",
  "interview_2",
  "graduated",
];

// ═══════════════════════════════════════════════
// Urutan status di database (untuk menentukan progres)
// ═══════════════════════════════════════════════

const STATUS_ORDER: Record<string, number> = {
  accepted: 1,
  training: 2,
  interview_1: 3,
  project_phase: 4,
  interview_2: 5,
  graduated: 6,
};

export async function CaangDashboard() {
  const [regResult, prodiResult, pipelineResult, linksResult] =
    await Promise.all([
      getMyRegistration(),
      getStudyProgramOptions(),
      getPipelineSteps(),
      getCommunityLinks(),
    ]);

  if (!regResult.data) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <Bot className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Tidak dapat memuat data</p>
        <p className="text-xs text-muted-foreground mt-1">
          {regResult.error ?? "Terjadi kesalahan."}
        </p>
      </div>
    );
  }

  const reg = regResult.data;
  const status = reg.status as OrRegistrationStatus;

  // ── 1. Tahap Pendaftaran (draft / submitted / revision) ──
  if (REGISTRATION_PHASE_STATUSES.includes(status)) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-md">
            <Sparkles className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Halo, {reg.full_name || "Calon Anggota"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Selamat datang di proses pendaftaran UKM Robotik PNP. Lengkapi
              data di bawah untuk melanjutkan.
            </p>
          </div>
        </div>

        {/* Progress info */}
        <div className="rounded-xl border bg-linear-to-r from-blue-500/5 to-indigo-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Pendaftaran Calon Anggota
              </p>
              <p className="text-xs text-muted-foreground">
                Ikuti 4 langkah mudah: Isi Data Diri → Upload Dokumen → Bayar
                Registrasi → Kirim & Tunggu Verifikasi
              </p>
            </div>
          </div>
        </div>

        {/* Wizard */}
        <CaangRegistrationWizard
          registration={reg}
          studyPrograms={prodiResult.data?.studyPrograms ?? []}
          majors={prodiResult.data?.majors ?? []}
        />
      </div>
    );
  }

  // ── 2. Ditolak ──
  if (status === "rejected") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center space-y-4">
          <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="size-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pendaftaran Ditolak
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mohon maaf, pendaftaran Anda sebagai calon anggota UKM Robotik PNP
            tidak dapat kami terima.
          </p>
          {reg.verification_notes && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left">
              <p className="text-xs font-semibold text-red-600 mb-1">
                Catatan dari Admin:
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {reg.verification_notes}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Akun Anda akan dihapus oleh sistem. Jika Anda merasa ini
              adalah kesalahan, silakan hubungi panitia OR.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Diterima / Dalam Proses Seleksi ──
  if (ACCEPTED_PIPELINE_STATUSES.includes(status)) {
    const pipelineSteps = pipelineResult.data;
    const communityLinks = linksResult.data;

    return (
      <AcceptedCaangDashboard
        fullName={reg.full_name || "Calon Anggota"}
        status={status}
        pipelineSteps={pipelineSteps}
        communityLinks={communityLinks}
      />
    );
  }

  // Fallback
  return null;
}

// ═══════════════════════════════════════════════
// Komponen Dashboard Caang yang sudah diterima
// ═══════════════════════════════════════════════

function AcceptedCaangDashboard({
  fullName,
  status,
  pipelineSteps,
  communityLinks,
}: {
  fullName: string;
  status: OrRegistrationStatus;
  pipelineSteps: PipelineStep[];
  communityLinks: CommunityLinks;
}) {
  const currentStatusOrder = STATUS_ORDER[status] ?? 0;
  const statusLabel =
    OR_REGISTRATION_STATUS_LABELS[status] ?? status;

  // Tentukan step saat ini berdasarkan mappedStatus
  const sortedSteps = [...pipelineSteps].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-md">
          <Sparkles className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Halo, {fullName}! 🎉
          </h1>
          <p className="text-sm text-muted-foreground">
            Selamat! Kamu resmi menjadi Calon Anggota UKM Robotik PNP. Berikut
            progres perjalananmu.
          </p>
        </div>
      </div>

      {/* ── Status Card ── */}
      <div className="rounded-xl border bg-linear-to-r from-emerald-500/5 to-teal-500/5 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Status Saat Ini:{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                {statusLabel}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Ikuti setiap tahapan seleksi dengan baik. Semangat! 💪
            </p>
          </div>
        </div>
      </div>

      {/* ── Pipeline Timeline ── */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          Timeline Seleksi
        </h2>
        <div className="relative">
          {sortedSteps.map((step, index) => {
            const stepStatusOrder = STATUS_ORDER[step.mappedStatus] ?? 0;
            const isCompleted = currentStatusOrder > stepStatusOrder;
            const isCurrent = currentStatusOrder === stepStatusOrder;
            const isLast = index === sortedSteps.length - 1;

            return (
              <div key={step.id} className="flex gap-4 relative">
                {/* Garis vertikal penghubung */}
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)] ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isCurrent
                          ? "bg-emerald-500/40"
                          : "bg-border"
                    }`}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                      <CheckCircle2 className="size-4" />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-md animate-pulse">
                      <Circle className="size-4 fill-current" />
                    </div>
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full border-2 border-muted-foreground/20 bg-background text-muted-foreground/40">
                      <Circle className="size-4" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 pb-6 ${
                    isCurrent
                      ? ""
                      : isCompleted
                        ? "opacity-70"
                        : "opacity-40"
                  }`}
                >
                  <div
                    className={`rounded-lg border p-3 ${
                      isCurrent
                        ? "border-blue-500/30 bg-blue-500/5 shadow-sm"
                        : isCompleted
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-semibold ${
                          isCurrent
                            ? "text-blue-700 dark:text-blue-400"
                            : isCompleted
                              ? "text-emerald-700 dark:text-emerald-400"
                              : ""
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                          Sedang Berlangsung
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-medium text-emerald-600">
                          ✓ Selesai
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Grid: Kegiatan Terdekat + Tugas Aktif ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Kegiatan Terdekat */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            Kegiatan Terdekat
          </h2>
          <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed text-center">
            <CalendarDays className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
              Belum ada jadwal kegiatan
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Kegiatan akan muncul di sini saat admin menambahkannya
            </p>
          </div>
        </div>

        {/* Tugas Aktif */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            Tugas Aktif
          </h2>
          <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed text-center">
            <ClipboardList className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
              Belum ada tugas
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Tugas dari panitia akan muncul di sini
            </p>
          </div>
        </div>
      </div>

      {/* ── Grid: Kelompok + Link Komunitas ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Info Kelompok */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Kelompok Seleksi
          </h2>
          <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed text-center">
            <Users className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
              Belum ada kelompok
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Pembagian kelompok akan diumumkan oleh panitia
            </p>
          </div>
        </div>

        {/* Link Komunitas */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="size-4 text-primary" />
            Grup & Komunitas
          </h2>
          <div className="space-y-3">
            {/* WhatsApp */}
            {communityLinks.whatsapp ? (
              <a
                href={communityLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/15">
                  <svg
                    className="size-5 text-green-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Grup WhatsApp</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Klik untuk bergabung
                  </p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Link WhatsApp belum tersedia
                </p>
              </div>
            )}

            {/* Discord */}
            {communityLinks.discord ? (
              <a
                href={communityLinks.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/15">
                  <svg
                    className="size-5 text-indigo-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Server Discord</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Klik untuk bergabung
                  </p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Link Discord belum tersedia
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
