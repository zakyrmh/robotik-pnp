/**
 * Halaman Pengaturan Overlay — /dashboard/mrc/streaming/overlay
 *
 * Mengatur live state: aktif/nonaktifkan scene overlay,
 * konfigurasi timer break & coming up, pilih match.
 */

import { Suspense } from 'react'
import { Settings2 } from 'lucide-react'

import { getMrcEvents, getCategoriesByEvent } from '@/app/actions/mrc.action'
import { OverlayController, OverlayControllerSkeleton } from '@/components/mrc/overlay-controller'

export default function OverlayConfigPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
          <Settings2 className="size-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Overlay</h1>
          <p className="text-sm text-muted-foreground">
            Kontrol scene overlay, timer break, dan pertandingan selanjutnya.
          </p>
        </div>
      </div>

      <Suspense fallback={<OverlayControllerSkeleton />}>
        <OverlayLoader />
      </Suspense>
    </div>
  )
}

async function OverlayLoader() {
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
    <OverlayController
      events={evResult.data}
      initialCategories={catResult.data ?? []}
    />
  )
}
