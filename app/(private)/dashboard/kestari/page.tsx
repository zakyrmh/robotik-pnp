import { Suspense } from 'react'
import {
  ClipboardList,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Banknote,
  CalendarDays,
} from 'lucide-react'

import { getPiketDashboardStats, getActivePeriod } from '@/app/actions/kestari.action'
import { Skeleton } from '@/components/ui/skeleton'

export default function KestariDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
          <ClipboardList className="size-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Kesekretariatan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan piket dan sanksi denda anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  const [statsResult, periodResult] = await Promise.all([
    getPiketDashboardStats(),
    getActivePeriod(),
  ])

  const stats = statsResult.data
  const period = periodResult.data

  if (!period) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <CalendarDays className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Belum ada periode piket aktif</p>
        <p className="text-xs text-muted-foreground mt-1">
          Buat periode baru di halaman <strong>Atur Jadwal Piket</strong>.
        </p>
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Anggota',
      value: stats?.totalMembers ?? 0,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: 'Terjadwal Piket',
      value: stats?.totalAssigned ?? 0,
      icon: CalendarDays,
      color: 'bg-indigo-500/10 text-indigo-600',
    },
    {
      label: 'Submit Bulan Ini',
      value: stats?.submittedThisMonth ?? 0,
      icon: ClipboardList,
      color: 'bg-violet-500/10 text-violet-600',
    },
    {
      label: 'Menunggu Verifikasi',
      value: stats?.pendingVerification ?? 0,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      label: 'Disetujui',
      value: stats?.approvedThisMonth ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Ditolak',
      value: stats?.rejectedThisMonth ?? 0,
      icon: XCircle,
      color: 'bg-red-500/10 text-red-600',
    },
    {
      label: 'Belum Bayar Denda',
      value: stats?.unpaidFines ?? 0,
      icon: AlertTriangle,
      color: 'bg-orange-500/10 text-orange-600',
    },
    {
      label: 'Total Denda',
      value: `Rp ${(stats?.totalFineAmount ?? 0).toLocaleString('id-ID')}`,
      icon: Banknote,
      color: 'bg-rose-500/10 text-rose-600',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Periode aktif */}
      <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-4 py-3 text-sm text-teal-700 dark:text-teal-400">
        <strong>Periode aktif:</strong> {period.name} &middot;{' '}
        Denda: Rp {period.fine_amount.toLocaleString('id-ID')} per bulan
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex size-8 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
