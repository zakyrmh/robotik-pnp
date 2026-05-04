/**
 * Halaman Matches Tournament - /private/tournament/matches
 *
 * Halaman untuk membuat dan mengelola pertandingan antar tim dalam grup.
 */

import { Suspense } from 'react'
import { Swords } from 'lucide-react'

import { MatchesManager } from '@/components/tournament/matches-manager'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export default function TournamentMatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <Swords className="size-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Matches Tournament
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal pertandingan, status, dan skor hasil turnamen
          </p>
        </div>
      </div>

      <Separator />

      <Suspense fallback={<TournamentMatchesSkeleton />}>
        <MatchesManager />
      </Suspense>
    </div>
  )
}

function TournamentMatchesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg border p-4 lg:col-span-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border p-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-3 h-20 w-full" />
          </div>
          <div className="rounded-lg border p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mt-3 h-8 w-full" />
            <Skeleton className="mt-3 h-8 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}
