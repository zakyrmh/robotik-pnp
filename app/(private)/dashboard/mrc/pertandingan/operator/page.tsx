/**
 * Halaman Panel Operator — /dashboard/mrc/pertandingan/operator
 *
 * Halaman kontrol utama untuk operator di lapangan saat pertandingan.
 * Fitur:
 * - Pilih event → kategori → pertandingan
 * - Kontrol timer countdown (set durasi, start, pause, reset)
 * - Input skor per babak (0-100)
 * - Tukar posisi tim (swap)
 * - Tentukan pemenang → bracket auto-advance
 */

import { Suspense } from 'react'
import { Gamepad2 } from 'lucide-react'

import { getMrcEvents, getCategoriesByEvent } from '@/app/actions/mrc.action'
import { OperatorPanel, OperatorSkeleton } from '@/components/mrc/operator-panel'

export default function OperatorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <Gamepad2 className="size-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel Operator</h1>
          <p className="text-sm text-muted-foreground">
            Kontrol pertandingan live — timer, skor, dan pemenang.
          </p>
        </div>
      </div>

      <Suspense fallback={<OperatorSkeleton />}>
        <OperatorLoader />
      </Suspense>
    </div>
  )
}

async function OperatorLoader() {
  const evResult = await getMrcEvents()
  if (evResult.error || !evResult.data?.length) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">
          {evResult.error ?? 'Belum ada event MRC'}
        </p>
      </div>
    )
  }

  const catResult = await getCategoriesByEvent(evResult.data[0].id)

  return (
    <OperatorPanel
      events={evResult.data}
      initialCategories={catResult.data ?? []}
    />
  )
}
