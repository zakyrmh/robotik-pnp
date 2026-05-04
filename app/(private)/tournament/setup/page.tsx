/**
 * Halaman Setup Tournament — /private/tournament/setup
 *
 * Halaman untuk setup turnamen yang mencakup:
 * - Tab Input Tim: form tambah tim dan tabel daftar tim
 * - Tab Grup: manajemen grup dan assign tim ke grup
 *
 * Menggunakan Suspense untuk loading state dan error handling.
 */

import { Suspense } from 'react'
import { AlertCircle, Trophy } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

import { SetupTournamentTabs } from '@/components/tournament/setup-tournament-tabs'

export default function TournamentSetupPage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Trophy className="size-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Setup Tournament
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola tim dan grup untuk persiapan turnamen
          </p>
        </div>
      </div>

      <Separator />

      {/* Konten dengan suspense */}
      <Suspense fallback={<SetupTournamentSkeleton />}>
        <SetupTournamentTabs />
      </Suspense>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Loading Skeleton
// ═════════════════════════════════════════════════════

function SetupTournamentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b">
        <Skeleton className="h-10 w-24 rounded-t" />
        <Skeleton className="h-10 w-24 rounded-t" />
      </div>

      {/* Content skeleton - Teams tab */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="rounded-lg border p-4 lg:col-span-1">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Right: Teams list */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border p-4">
            <Skeleton className="mb-4 h-5 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
