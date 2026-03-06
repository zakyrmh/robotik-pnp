import { Suspense } from 'react'
import { UserCheck } from 'lucide-react'

import { getRegistrations } from '@/app/actions/or.action'
import { VerifikasiManager, VerifikasiSkeleton } from '@/components/or/verifikasi-manager'

export default function VerifikasiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <UserCheck className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verifikasi Pendaftar</h1>
          <p className="text-sm text-muted-foreground">
            Review dan verifikasi data calon anggota yang mendaftar.
          </p>
        </div>
      </div>

      <Suspense fallback={<VerifikasiSkeleton />}>
        <VerifikasiLoader />
      </Suspense>
    </div>
  )
}

async function VerifikasiLoader() {
  const result = await getRegistrations()
  return <VerifikasiManager initialRegistrations={result.data ?? []} />
}
