import { Suspense } from 'react'
import { Zap } from 'lucide-react'

import { getViolations, getMemberPointSummaries, getAllMembers } from '@/app/actions/komdis.action'
import { ViolationManager, ViolationSkeleton } from '@/components/komdis/violation-manager'

export default function PoinPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <Zap className="size-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Input & Edit Poin</h1>
          <p className="text-sm text-muted-foreground">
            Catat pelanggaran dan kelola poin anggota UKM.
          </p>
        </div>
      </div>

      <Suspense fallback={<ViolationSkeleton />}>
        <PoinLoader />
      </Suspense>
    </div>
  )
}

async function PoinLoader() {
  const [violationsRes, summariesRes, membersRes] = await Promise.all([
    getViolations(),
    getMemberPointSummaries(),
    getAllMembers(),
  ])

  return (
    <ViolationManager
      initialViolations={violationsRes.data ?? []}
      initialSummaries={summariesRes.data ?? []}
      members={membersRes.data ?? []}
    />
  )
}
