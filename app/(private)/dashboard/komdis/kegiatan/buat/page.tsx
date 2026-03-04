import { Suspense } from 'react'
import { CalendarPlus } from 'lucide-react'

import { getKomdisEvents } from '@/app/actions/komdis.action'
import { KegiatanManager, KegiatanSkeleton } from '@/components/komdis/kegiatan-manager'

export default function BuatKegiatanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
          <CalendarPlus className="size-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Kegiatan</h1>
          <p className="text-sm text-muted-foreground">
            Buat dan kelola kegiatan resmi UKM untuk absensi anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<KegiatanSkeleton />}>
        <KegiatanLoader />
      </Suspense>
    </div>
  )
}

async function KegiatanLoader() {
  const result = await getKomdisEvents()

  return <KegiatanManager initialEvents={result.data ?? []} />
}
