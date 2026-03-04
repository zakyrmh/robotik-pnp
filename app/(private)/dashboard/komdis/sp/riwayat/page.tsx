import { Suspense } from 'react'
import { History } from 'lucide-react'

import { getWarningLetters, getAllMembers } from '@/app/actions/komdis.action'
import { SpRiwayatManager, SpRiwayatSkeleton } from '@/components/komdis/sp-riwayat-manager'

export default function RiwayatSpPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <History className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat SP Anggota</h1>
          <p className="text-sm text-muted-foreground">
            Lihat riwayat lengkap Surat Peringatan seluruh anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<SpRiwayatSkeleton />}>
        <RiwayatLoader />
      </Suspense>
    </div>
  )
}

async function RiwayatLoader() {
  const [lettersRes, membersRes] = await Promise.all([
    getWarningLetters(),
    getAllMembers(),
  ])

  return (
    <SpRiwayatManager
      initialLetters={lettersRes.data ?? []}
      members={membersRes.data ?? []}
    />
  )
}
