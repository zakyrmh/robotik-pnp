/**
 * Halaman Klasemen & Bracket — /dashboard/mrc/pertandingan/bracket
 *
 * Digunakan panitia untuk:
 * - Melihat klasemen grup (tabel standing per grup)
 * - Melihat bracket eliminasi (visualisasi pohon)
 * - Melihat jadwal dan hasil pertandingan per kategori
 */

import { Suspense } from 'react'
import { Trophy } from 'lucide-react'

import { getMrcEvents, getCategoriesByEvent } from '@/app/actions/mrc.action'
import { BracketManager, BracketSkeleton } from '@/components/mrc/bracket-manager'

export default function BracketPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
          <Trophy className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Klasemen & Bracket
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau standing grup dan bracket eliminasi.
          </p>
        </div>
      </div>

      <Suspense fallback={<BracketSkeleton />}>
        <BracketLoader />
      </Suspense>
    </div>
  )
}

async function BracketLoader() {
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
    <BracketManager
      events={evResult.data}
      initialCategories={catResult.data ?? []}
    />
  )
}
