import { Suspense } from 'react'
import { Database } from 'lucide-react'

import { getRegistrations } from '@/app/actions/or.action'
import { DatabaseManager, DatabaseSkeleton } from '@/components/or/database-manager'

export default function DatabasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
          <Database className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database & Edit Data</h1>
          <p className="text-sm text-muted-foreground">
            Lihat dan edit data seluruh pendaftar calon anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<DatabaseSkeleton />}>
        <DatabaseLoader />
      </Suspense>
    </div>
  )
}

async function DatabaseLoader() {
  const result = await getRegistrations()
  return <DatabaseManager initialRegistrations={result.data ?? []} />
}
