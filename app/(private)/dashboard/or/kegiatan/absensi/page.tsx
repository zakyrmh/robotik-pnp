import { Suspense } from 'react'
import { ClipboardCheck } from 'lucide-react'

import { adminGetEvents } from '@/app/actions/or-events.action'
import { AbsensiManager, AbsensiSkeleton } from '@/components/or/absensi-manager'

export default function AbsensiKegiatanPage() {
  return (
    <div className="space-y-6">
      {/* Dynamic Header Style consistently across modules */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <ClipboardCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scan QR / Input Absensi</h1>
          <p className="text-sm text-muted-foreground">
            Manajemen kehadiran dan scan QR token caang secara real-time.
          </p>
        </div>
      </div>

      <Suspense fallback={<AbsensiSkeleton />}>
        <AbsensiLoader />
      </Suspense>
    </div>
  )
}

async function AbsensiLoader() {
  const result = await adminGetEvents()
  
  // Hanya ambil event yang draft atau published (aktif)
  const activeEvents = (result.data ?? []).filter(e => e.status !== 'archived')
  
  return <AbsensiManager initialEvents={activeEvents} />
}
