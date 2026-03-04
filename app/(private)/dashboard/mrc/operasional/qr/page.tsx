/**
 * Halaman Generate & Cetak QR — /dashboard/mrc/operasional/qr
 *
 * Halaman ini digunakan panitia untuk:
 * - Generate QR codes batch untuk seluruh peserta event
 * - Melihat daftar QR yang sudah di-generate
 * - Cetak kokarde (QR + nama + tim) via print dialog browser
 */

import { Suspense } from 'react'
import { QrCode } from 'lucide-react'

import { getMrcEvents } from '@/app/actions/mrc.action'
import {
  QrManager,
  QrManagerSkeleton,
} from '@/components/mrc/qr-manager'

export default function QrPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <QrCode className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Generate & Cetak QR
          </h1>
          <p className="text-sm text-muted-foreground">
            Buat QR code kokarde untuk setiap peserta dan cetak.
          </p>
        </div>
      </div>

      <Suspense fallback={<QrManagerSkeleton />}>
        <QrLoader />
      </Suspense>
    </div>
  )
}

async function QrLoader() {
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
  return <QrManager events={events} />
}
