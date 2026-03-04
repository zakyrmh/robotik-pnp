/**
 * Halaman Scan QR Anti Joki — /dashboard/mrc/operasional/scan
 *
 * Halaman ini digunakan panitia MRC untuk:
 * - Verifikasi identitas peserta saat pertandingan (anti-joki)
 * - Kontrol masuk/keluar gedung PKM selama acara
 * - Mencatat log scan untuk audit trail
 *
 * Mode scan:
 * 1. Check-in: Pendaftaran ulang hari-H
 * 2. Entry: Masuk gedung
 * 3. Exit: Keluar gedung
 * 4. Match Verify: Verifikasi anggota tim saat dipanggil bertanding
 */

import { Suspense } from 'react'
import { ScanLine } from 'lucide-react'

import { getMrcEvents } from '@/app/actions/mrc.action'
import {
  ScanQrManager,
  ScanQrSkeleton,
} from '@/components/mrc/scan-qr-manager'

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <ScanLine className="size-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Scan QR Anti Joki
          </h1>
          <p className="text-sm text-muted-foreground">
            Verifikasi identitas peserta dan kontrol akses gedung.
          </p>
        </div>
      </div>

      <Suspense fallback={<ScanQrSkeleton />}>
        <ScanLoader />
      </Suspense>
    </div>
  )
}

async function ScanLoader() {
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
      </div>
    )
  }
  return <ScanQrManager events={events} />
}
