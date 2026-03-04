import { Suspense } from 'react'
import { ScanLine } from 'lucide-react'

import { getKomdisEvents } from '@/app/actions/komdis.action'
import { AbsensiManager, AbsensiSkeleton } from '@/components/komdis/absensi-manager'

export default function AbsensiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
          <ScanLine className="size-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Absensi</h1>
          <p className="text-sm text-muted-foreground">
            Scan QR Code anggota dan kelola kehadiran kegiatan.
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
  const result = await getKomdisEvents()
  const events = (result.data ?? []).filter(
    (e) => e.status === 'ongoing' || e.status === 'upcoming' || e.status === 'completed'
  )

  return <AbsensiManager events={events} />
}
