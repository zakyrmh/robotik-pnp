import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'

import { getActivePeriod, getPiketFines } from '@/app/actions/kestari.action'
import { PelanggarManager, PelanggarSkeleton } from '@/components/kestari/pelanggar-manager'

export default function PelanggarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Pelanggar Piket</h1>
          <p className="text-sm text-muted-foreground">
            Anggota yang belum melaksanakan piket dan terkena denda.
          </p>
        </div>
      </div>

      <Suspense fallback={<PelanggarSkeleton />}>
        <PelanggarLoader />
      </Suspense>
    </div>
  )
}

async function PelanggarLoader() {
  const periodRes = await getActivePeriod()
  if (!periodRes.data) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">Belum ada periode piket aktif.</p>
      </div>
    )
  }

  const finesRes = await getPiketFines(periodRes.data.id)

  return (
    <PelanggarManager
      period={periodRes.data}
      initialFines={finesRes.data ?? []}
    />
  )
}
