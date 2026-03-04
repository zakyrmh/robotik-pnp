import { Suspense } from 'react'
import { CalendarDays } from 'lucide-react'

import { getActivePeriod, getPiketAssignments, getPiketPeriods } from '@/app/actions/kestari.action'
import { PiketScheduleManager, ScheduleSkeleton } from '@/components/kestari/piket-schedule-manager'

export default function JadwalPiketPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <CalendarDays className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atur Jadwal Piket</h1>
          <p className="text-sm text-muted-foreground">
            Buat periode, generate jadwal, dan kelola minggu piket anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleLoader />
      </Suspense>
    </div>
  )
}

async function ScheduleLoader() {
  const [periodsRes, activeRes] = await Promise.all([
    getPiketPeriods(),
    getActivePeriod(),
  ])

  const periods = periodsRes.data ?? []
  const activePeriod = activeRes.data

  let assignments: Awaited<ReturnType<typeof getPiketAssignments>>['data'] = []
  if (activePeriod) {
    const aRes = await getPiketAssignments(activePeriod.id)
    assignments = aRes.data ?? []
  }

  return (
    <PiketScheduleManager
      periods={periods}
      activePeriod={activePeriod}
      initialAssignments={assignments ?? []}
    />
  )
}
