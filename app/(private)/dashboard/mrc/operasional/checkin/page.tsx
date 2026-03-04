/**
 * Halaman Pendaftaran Ulang — /dashboard/mrc/operasional/checkin
 *
 * Halaman ini digunakan panitia untuk:
 * - Melihat statistik check-in realtime
 * - Scan QR kokarde peserta untuk pendaftaran ulang
 * - Melihat siapa saja yang sudah/belum check-in
 * - Tracking keluar-masuk gedung
 */

import { Suspense } from 'react'
import { Ticket } from 'lucide-react'

import { getMrcEvents } from '@/app/actions/mrc.action'
import {
  CheckinManager,
  CheckinSkeleton,
} from '@/components/mrc/checkin-manager'

export default function CheckinPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <Ticket className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pendaftaran Ulang
          </h1>
          <p className="text-sm text-muted-foreground">
            Check-in peserta hari-H menggunakan scan QR kokarde.
          </p>
        </div>
      </div>

      <Suspense fallback={<CheckinSkeleton />}>
        <CheckinLoader />
      </Suspense>
    </div>
  )
}

async function CheckinLoader() {
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
  return <CheckinManager events={events} />
}
