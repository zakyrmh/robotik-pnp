import { Suspense } from 'react'
import { Ban } from 'lucide-react'

import { getBlacklist, getRegistrations } from '@/app/actions/or.action'
import { BlacklistManager, BlacklistSkeleton } from '@/components/or/blacklist-manager'

export default function BlacklistPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <Ban className="size-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Blacklist Caang</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar calon anggota yang diblacklist.
          </p>
        </div>
      </div>

      <Suspense fallback={<BlacklistSkeleton />}>
        <BlacklistLoader />
      </Suspense>
    </div>
  )
}

async function BlacklistLoader() {
  const [blacklistRes, regsRes] = await Promise.all([
    getBlacklist(),
    getRegistrations(),
  ])

  // Build member list from registrations for "add to blacklist" dropdown
  const members = (regsRes.data ?? []).map((r) => ({
    id: r.user_id,
    full_name: r.full_name,
    email: r.email,
  }))

  return (
    <BlacklistManager
      initialBlacklist={blacklistRes.data ?? []}
      members={members}
    />
  )
}
