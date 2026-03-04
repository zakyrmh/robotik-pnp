/**
 * Halaman Verifikasi Berkas & Tim — /dashboard/mrc/peserta/berkas
 *
 * Halaman ini digunakan oleh panitia MRC untuk:
 * - Memverifikasi kelengkapan berkas pendaftaran tim
 * - Melihat detail anggota tim, ketua, dan pembimbing
 * - Menyetujui, meminta revisi, atau menolak pendaftaran
 *
 * Alur verifikasi:
 * pending → documents_verified (berkas lengkap)
 *         → revision (perlu perbaikan, peserta revisi ulang)
 *         → rejected (ditolak final)
 */

import { Suspense } from 'react'
import { Shield } from 'lucide-react'

import { getMrcEvents } from '@/app/actions/mrc.action'
import {
  TeamVerificationTable,
  TeamVerificationSkeleton,
} from '@/components/mrc/team-verification-table'

export default function VerifikasiBerkasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Shield className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Verifikasi Berkas & Tim
          </h1>
          <p className="text-sm text-muted-foreground">
            Periksa kelengkapan berkas dan data tim peserta MRC.
          </p>
        </div>
      </div>

      <Suspense fallback={<TeamVerificationSkeleton />}>
        <VerifikasiBerkasLoader />
      </Suspense>
    </div>
  )
}

async function VerifikasiBerkasLoader() {
  const result = await getMrcEvents()

  if (result.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">{result.error}</p>
      </div>
    )
  }

  const events = result.data ?? []

  if (events.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">Belum ada event MRC</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Buat event terlebih dahulu di halaman{' '}
          <a href="/dashboard/mrc/pengaturan/pendaftaran" className="text-blue-600 hover:underline">
            Buka/Tutup Pendaftaran
          </a>.
        </p>
      </div>
    )
  }

  return <TeamVerificationTable events={events} />
}
