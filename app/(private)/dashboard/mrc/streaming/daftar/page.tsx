/**
 * Halaman Daftar Overlay — /dashboard/mrc/streaming/daftar
 *
 * Menampilkan daftar URL overlay untuk copy-paste ke OBS Browser Source.
 */

import { Suspense } from 'react'
import { Monitor } from 'lucide-react'

import { getMrcEvents, getCategoriesByEvent } from '@/app/actions/mrc.action'
import { OverlayList, OverlayListSkeleton } from '@/components/mrc/overlay-list'

export default function DaftarOverlayPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
          <Monitor className="size-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Overlay</h1>
          <p className="text-sm text-muted-foreground">
            Salin URL overlay ke Browser Source di OBS Studio.
          </p>
        </div>
      </div>

      <Suspense fallback={<OverlayListSkeleton />}>
        <DaftarLoader />
      </Suspense>
    </div>
  )
}

async function DaftarLoader() {
  const evResult = await getMrcEvents()
  if (evResult.error || !evResult.data?.length) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">{evResult.error ?? 'Belum ada event MRC'}</p>
      </div>
    )
  }

  const catResult = await getCategoriesByEvent(evResult.data[0].id)

  return (
    <OverlayList
      events={evResult.data}
      initialCategories={catResult.data ?? []}
    />
  )
}
