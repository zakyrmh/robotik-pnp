import { Suspense } from 'react'
import { MessageSquareWarning } from 'lucide-react'

import { getPointReductions } from '@/app/actions/komdis.action'
import { ReductionReviewManager, ReductionSkeleton } from '@/components/komdis/reduction-review-manager'

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
          <MessageSquareWarning className="size-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Pengurangan Poin</h1>
          <p className="text-sm text-muted-foreground">
            Tinjau dan proses pengajuan pengurangan poin dari anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<ReductionSkeleton />}>
        <ReviewLoader />
      </Suspense>
    </div>
  )
}

async function ReviewLoader() {
  const result = await getPointReductions()

  return <ReductionReviewManager initialReductions={result.data ?? []} />
}
