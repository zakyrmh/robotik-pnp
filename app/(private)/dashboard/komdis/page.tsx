import { Suspense } from 'react'
import Link from 'next/link'
import {
  Shield,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  FileText,
  ArrowDown,
  ArrowRight,
  Gavel,
  QrCode,
  Ban,
} from 'lucide-react'

import { getKomdisDashboardStats } from '@/app/actions/komdis.action'
import { Skeleton } from '@/components/ui/skeleton'

export default function KomdisDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
          <Shield className="size-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Komisi Disiplin</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan kegiatan, kehadiran, pelanggaran & poin, serta surat peringatan.
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
  const result = await getKomdisDashboardStats()
  const s = result.data

  if (!s) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <Shield className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Tidak dapat memuat data</p>
        <p className="text-xs text-muted-foreground mt-1">
          {result.error ?? 'Terjadi kesalahan.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert banners */}
      <div className="flex flex-col gap-2">
        {s.ongoingEvents > 0 && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
            <strong>{s.ongoingEvents}</strong> kegiatan sedang berlangsung
            <Link href="/dashboard/komdis/kegiatan/absensi" className="ml-auto text-xs underline underline-offset-2 hover:text-emerald-600 transition-colors flex items-center gap-1">
              Kelola Absensi <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
        {s.pendingReductions > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <Clock className="size-4" />
            <strong>{s.pendingReductions}</strong> pengajuan pengurangan poin menunggu review
            <Link href="/dashboard/komdis/pelanggaran/review" className="ml-auto text-xs underline underline-offset-2 hover:text-amber-600 transition-colors flex items-center gap-1">
              Review <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ── Kegiatan & Kehadiran ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <CalendarDays className="size-4" /> Kegiatan & Kehadiran
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Kegiatan', value: s.totalEvents, icon: CalendarDays, color: 'bg-blue-500/10 text-blue-600' },
            { label: 'Berlangsung', value: s.ongoingEvents, icon: QrCode, color: 'bg-emerald-500/10 text-emerald-600' },
            { label: 'Akan Datang', value: s.upcomingEvents, icon: Clock, color: 'bg-sky-500/10 text-sky-600' },
            { label: 'Selesai', value: s.completedEvents, icon: CheckCircle2, color: 'bg-zinc-500/10 text-zinc-500' },
            { label: 'Total Hadir', value: s.totalPresent, icon: Users, color: 'bg-indigo-500/10 text-indigo-600' },
            { label: 'Total Terlambat', value: s.totalLate, icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
          ].map((card) => {
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

      {/* ── Pelanggaran & Poin ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Gavel className="size-4" /> Pelanggaran & Poin
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Pelanggaran', value: s.totalViolations, icon: AlertTriangle, color: 'bg-red-500/10 text-red-600' },
            { label: 'Total Poin', value: s.totalPoints, icon: Zap, color: 'bg-orange-500/10 text-orange-600' },
            { label: 'Poin Dikurangi', value: s.totalReductions, icon: ArrowDown, color: 'bg-emerald-500/10 text-emerald-600' },
            { label: 'Pending Review', value: s.pendingReductions, icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
          ].map((card) => {
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

      {/* ── Surat Peringatan ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <FileText className="size-4" /> Surat Peringatan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total SP', value: s.totalSp, icon: FileText, color: 'bg-indigo-500/10 text-indigo-600' },
            { label: 'SP Aktif', value: s.activeSp, icon: AlertTriangle, color: 'bg-blue-500/10 text-blue-600' },
            { label: 'SP-1', value: s.sp1Count, icon: FileText, color: 'bg-amber-500/10 text-amber-600' },
            { label: 'SP-2', value: s.sp2Count, icon: FileText, color: 'bg-orange-500/10 text-orange-600' },
            { label: 'SP-3', value: s.sp3Count, icon: Ban, color: 'bg-red-500/10 text-red-600' },
          ].map((card) => {
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

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Buat Kegiatan', href: '/dashboard/komdis/kegiatan/buat', icon: CalendarDays, desc: 'Buat kegiatan resmi UKM', color: 'text-blue-600 bg-blue-500/10' },
            { label: 'Kelola Absensi', href: '/dashboard/komdis/kegiatan/absensi', icon: QrCode, desc: 'Scan QR absensi anggota', color: 'text-emerald-600 bg-emerald-500/10' },
            { label: 'Input Pelanggaran', href: '/dashboard/komdis/pelanggaran/poin', icon: Zap, desc: 'Catat pelanggaran & poin', color: 'text-red-600 bg-red-500/10' },
            { label: 'Review Pengurangan', href: '/dashboard/komdis/pelanggaran/review', icon: Clock, desc: 'Review pengajuan poin', color: 'text-amber-600 bg-amber-500/10' },
            { label: 'Terbitkan SP', href: '/dashboard/komdis/sp/terbit', icon: FileText, desc: 'Buat Surat Peringatan', color: 'text-rose-600 bg-rose-500/10' },
            { label: 'Riwayat SP', href: '/dashboard/komdis/sp/riwayat', icon: FileText, desc: 'Lihat riwayat SP anggota', color: 'text-indigo-600 bg-indigo-500/10' },
          ].map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${link.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{link.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{link.desc}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-auto shrink-0 mt-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-lg" />
      <div>
        <Skeleton className="h-4 w-40 rounded mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-36 rounded mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-36 rounded mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-24 rounded mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}
