/**
 * Halaman Drawing Grup — /dashboard/mrc/pertandingan/drawing
 *
 * Digunakan panitia untuk:
 * - Membagi tim ke grup secara acak (drawing)
 * - Mengatur jumlah tim per grup
 * - Generate jadwal pertandingan fase grup (round-robin)
 * - Melihat hasil drawing
 */

import { Suspense } from 'react'
import { Dices } from 'lucide-react'

import { getMrcEvents, getCategoriesByEvent } from '@/app/actions/mrc.action'
import { DrawingManager, DrawingSkeleton } from '@/components/mrc/drawing-manager'

export default function DrawingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Dices className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drawing Grup</h1>
          <p className="text-sm text-muted-foreground">
            Bagi tim ke dalam grup secara acak dan generate jadwal pertandingan.
          </p>
        </div>
      </div>

      <Suspense fallback={<DrawingSkeleton />}>
        <DrawingLoader />
      </Suspense>
    </div>
  )
}

async function DrawingLoader() {
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

  // Ambil kategori untuk event pertama
  const catResult = await getCategoriesByEvent(evResult.data[0].id)

  return (
    <DrawingManager
      events={evResult.data}
      initialCategories={catResult.data ?? []}
    />
  )
}
