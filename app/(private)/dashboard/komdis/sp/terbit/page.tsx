import { Suspense } from 'react'
import { FileText } from 'lucide-react'

import { getWarningLetters, getAllMembers, getMemberPointSummaries } from '@/app/actions/komdis.action'
import { SpTerbitManager, SpTerbitSkeleton } from '@/components/komdis/sp-terbit-manager'

export default function TerbitSpPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
          <FileText className="size-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penerbitan SP Digital</h1>
          <p className="text-sm text-muted-foreground">
            Buat dan terbitkan Surat Peringatan untuk anggota yang melanggar.
          </p>
        </div>
      </div>

      <Suspense fallback={<SpTerbitSkeleton />}>
        <SpTerbitLoader />
      </Suspense>
    </div>
  )
}

async function SpTerbitLoader() {
  const [lettersRes, membersRes, summariesRes] = await Promise.all([
    getWarningLetters(),
    getAllMembers(),
    getMemberPointSummaries(),
  ])

  return (
    <SpTerbitManager
      initialLetters={lettersRes.data ?? []}
      members={membersRes.data ?? []}
      pointSummaries={summariesRes.data ?? []}
    />
  )
}
