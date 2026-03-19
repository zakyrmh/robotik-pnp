import { Suspense } from 'react'
import { Trophy } from 'lucide-react'

import { adminGetAttendanceSummary } from '@/app/actions/or-events.action'
import { RekapitulasiManager, RekapitulasiSkeleton } from '@/components/or/rekapitulasi-manager'

export default function RekapitulasiPoinPage() {
  return (
    <div className="space-y-6">
      {/* Header Consistent with OR Modules */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Trophy className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekap & Akumulasi Poin</h1>
          <p className="text-sm text-muted-foreground">
            Akumulasi poin kehadiran seluruh calon anggota selama rangkaian seleksi OR.
          </p>
        </div>
      </div>

      <Suspense fallback={<RekapitulasiSkeleton />}>
        <RekapitulasiLoader />
      </Suspense>
    </div>
  )
}

async function RekapitulasiLoader() {
  const result = await adminGetAttendanceSummary()
  return <RekapitulasiManager initialSummary={result.data ?? []} />
}
