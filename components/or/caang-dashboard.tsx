/**
 * CaangDashboard — Server Component pembungkus wizard pendaftaran caang.
 *
 * Fetch data:
 * - Registration milik user (auto-create jika belum ada)
 * - Daftar jurusan & prodi untuk dropdown
 * - Profil user
 */

import { Bot, Sparkles } from 'lucide-react'
import { getMyRegistration, getStudyProgramOptions } from '@/app/actions/or.action'
import { CaangRegistrationWizard } from '@/components/or/caang-registration-wizard'

export async function CaangDashboard() {
  const [regResult, prodiResult] = await Promise.all([
    getMyRegistration(),
    getStudyProgramOptions(),
  ])

  if (!regResult.data) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <Bot className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Tidak dapat memuat data</p>
        <p className="text-xs text-muted-foreground mt-1">{regResult.error ?? 'Terjadi kesalahan.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-md">
          <Sparkles className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Halo, {regResult.data.full_name || 'Calon Anggota'}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang di proses pendaftaran UKM Robotik PNP. Lengkapi data di bawah untuk melanjutkan.
          </p>
        </div>
      </div>

      {/* Progress info */}
      <div className="rounded-xl border bg-linear-to-r from-blue-500/5 to-indigo-500/5 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Bot className="size-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Pendaftaran Calon Anggota</p>
            <p className="text-xs text-muted-foreground">
              Ikuti 4 langkah mudah: Isi Data Diri → Upload Dokumen → Bayar Registrasi → Kirim & Tunggu Verifikasi
            </p>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <CaangRegistrationWizard
        registration={regResult.data}
        studyPrograms={prodiResult.data?.studyPrograms ?? []}
        majors={prodiResult.data?.majors ?? []}
      />
    </div>
  )
}
