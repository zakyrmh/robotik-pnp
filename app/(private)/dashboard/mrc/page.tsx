/**
 * Halaman Dashboard MRC — /dashboard/mrc
 *
 * Overview untuk modul Minangkabau Robot Contest, menampilkan:
 * - Status event aktif/terbaru
 * - Statistik kategori lomba
 * - Timeline pendaftaran
 * - Quick links ke semua sub-halaman MRC
 *
 * Data diambil dari server action getMrcEvents() yang
 * sudah ada — tidak perlu server action baru.
 *
 * Catatan:
 * - Proteksi autentikasi dilakukan di layout.tsx (private)
 * - Data diambil server-side secara paralel via Suspense
 */

import { Suspense } from 'react'
import Link from 'next/link'
import {
  Trophy,
  CalendarDays,
  Layers,
  Settings,
  Users,
  Shield,
  Banknote,
  Ticket,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  FolderOpen,
  QrCode,
  Swords,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { getMrcEvents, type MrcEventWithStats } from '@/app/actions/mrc.action'
import { MRC_STATUS_LABELS, type MrcEventStatus } from '@/lib/db/schema/mrc'

export default function DashboardMrcPage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <Trophy className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard MRC
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview Minangkabau Robot Contest — event lomba robot tahunan UKM
            Robotik PNP.
          </p>
        </div>
      </div>

      {/* Konten dashboard */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN ASYNC: Loader konten
// ═════════════════════════════════════════════════════

async function DashboardContent() {
  const result = await getMrcEvents()

  if (result.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">{result.error}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Silakan muat ulang halaman atau hubungi administrator.
        </p>
      </div>
    )
  }

  const events = result.data ?? []

  // Event aktif = bukan draft/completed/cancelled, atau event terbaru
  const activeEvent =
    events.find((e) =>
      ['registration', 'closed', 'ongoing'].includes(e.status)
    ) ?? events[0]

  // Statistik keseluruhan
  const totalEvents = events.length
  const totalCategories = events.reduce((sum, e) => sum + e.category_count, 0)
  const activeEventCount = events.filter((e) =>
    ['registration', 'closed', 'ongoing'].includes(e.status)
  ).length

  return (
    <>
      {/* Baris 1: Event aktif (hero card) */}
      {activeEvent ? (
        <ActiveEventCard event={activeEvent} />
      ) : (
        <NoEventBanner />
      )}

      {/* Baris 2: Statistik ringkasan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label="Total Event"
          value={totalEvents.toString()}
          color="blue"
        />
        <StatCard
          icon={Layers}
          label="Total Kategori"
          value={totalCategories.toString()}
          color="violet"
        />
        <StatCard
          icon={Radio}
          label="Event Aktif"
          value={activeEventCount.toString()}
          color="emerald"
        />
      </div>

      {/* Baris 3: Quick links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">Menu MRC</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MRC_QUICK_LINKS.map((link) => (
            <QuickLink key={link.href} {...link} />
          ))}
        </div>
      </div>

      {/* Baris 4: Daftar semua event */}
      {events.length > 1 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Semua Event</h2>
          <div className="rounded-xl border bg-card shadow-sm divide-y">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Card event aktif (hero)
// ═════════════════════════════════════════════════════

/** Konfigurasi visual status */
const STATUS_VISUAL: Record<
  MrcEventStatus,
  { className: string; dotColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: {
    className: 'bg-zinc-500/15 text-zinc-700 border-zinc-500/25 dark:text-zinc-400',
    dotColor: 'bg-zinc-400',
    icon: AlertCircle,
  },
  registration: {
    className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  closed: {
    className: 'bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  ongoing: {
    className: 'bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    icon: Radio,
  },
  completed: {
    className: 'bg-violet-500/15 text-violet-700 border-violet-500/25 dark:text-violet-400',
    dotColor: 'bg-violet-500',
    icon: CheckCircle2,
  },
  cancelled: {
    className: 'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400',
    dotColor: 'bg-red-500',
    icon: AlertCircle,
  },
}

function ActiveEventCard({ event }: { event: MrcEventWithStats }) {
  const sv = STATUS_VISUAL[event.status]
  const StatusIcon = sv.icon

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`size-2.5 rounded-full ${sv.dotColor} animate-pulse`} />
            <h2 className="text-lg font-bold">{event.name}</h2>
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground">{event.description}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`text-xs font-medium px-2.5 py-1 ${sv.className}`}
        >
          <StatusIcon className="mr-1.5 size-3.5" />
          {MRC_STATUS_LABELS[event.status]}
        </Badge>
      </div>

      <Separator />

      {/* Info grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem
          icon={CalendarDays}
          label="Pendaftaran Buka"
          value={formatDate(event.registration_open)}
        />
        <InfoItem
          icon={Clock}
          label="Pendaftaran Tutup"
          value={formatDate(event.registration_close)}
        />
        <InfoItem
          icon={MapPin}
          label="Lokasi"
          value={event.venue ?? '—'}
        />
        <InfoItem
          icon={FolderOpen}
          label="Kategori Lomba"
          value={`${event.category_count} kategori`}
        />
      </div>
    </div>
  )
}

function NoEventBanner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-12 text-center shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-xl bg-blue-500/10">
        <Trophy className="size-7 text-blue-500" />
      </div>
      <div>
        <p className="text-sm font-semibold">Belum ada event MRC</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-[300px]">
          Buat event pertama di halaman Buka/Tutup Pendaftaran untuk memulai.
        </p>
      </div>
      <Link
        href="/dashboard/mrc/pengaturan/pendaftaran"
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Buat Event
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Quick links
// ═════════════════════════════════════════════════════

/** Daftar quick link ke sub-halaman MRC */
const MRC_QUICK_LINKS = [
  {
    title: 'Buka/Tutup Pendaftaran',
    description: 'Kelola status dan jadwal pendaftaran event.',
    href: '/dashboard/mrc/pengaturan/pendaftaran',
    icon: Settings,
    color: 'blue' as const,
  },
  {
    title: 'Kategori Lomba & Biaya',
    description: 'Atur kategori, biaya, dan konfigurasi tim.',
    href: '/dashboard/mrc/pengaturan/kategori',
    icon: Layers,
    color: 'violet' as const,
  },
  {
    title: 'Verifikasi Berkas & Tim',
    description: 'Verifikasi kelengkapan berkas peserta.',
    href: '/dashboard/mrc/peserta/berkas',
    icon: Shield,
    color: 'amber' as const,
  },
  {
    title: 'Verifikasi Pembayaran',
    description: 'Konfirmasi pembayaran pendaftaran peserta.',
    href: '/dashboard/mrc/peserta/pembayaran',
    icon: Banknote,
    color: 'emerald' as const,
  },
  {
    title: 'Pendaftaran Ulang',
    description: 'Daftar ulang peserta di hari pelaksanaan.',
    href: '/dashboard/mrc/operasional/checkin',
    icon: Ticket,
    color: 'zinc' as const,
  },
  {
    title: 'Generate & Cetak QR',
    description: 'Buat dan cetak QR code untuk peserta.',
    href: '/dashboard/mrc/operasional/qr',
    icon: QrCode,
    color: 'zinc' as const,
  },
  {
    title: 'Drawing Grup',
    description: 'Undi dan atur pembagian grup pertandingan.',
    href: '/dashboard/mrc/pertandingan/drawing',
    icon: Users,
    color: 'blue' as const,
  },
  {
    title: 'Realtime Bracket',
    description: 'Pantau dan kelola bracket pertandingan.',
    href: '/dashboard/mrc/pertandingan/bracket',
    icon: Swords,
    color: 'violet' as const,
  },
] as const

/** Peta warna untuk ikon quick link */
const COLOR_MAP = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  zinc: { bg: 'bg-zinc-500/10', text: 'text-zinc-600 dark:text-zinc-400' },
} as const

function QuickLink({
  title,
  description,
  href,
  icon: Icon,
  color,
}: (typeof MRC_QUICK_LINKS)[number]) {
  const colors = COLOR_MAP[color]

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
    >
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
        <Icon className={`size-4 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
    </Link>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Baris event di daftar
// ═════════════════════════════════════════════════════

function EventRow({ event }: { event: MrcEventWithStats }) {
  const sv = STATUS_VISUAL[event.status]

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`size-2 rounded-full shrink-0 ${sv.dotColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.name}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className={`text-[9px] font-medium px-1.5 py-0 ${sv.className}`}
          >
            {MRC_STATUS_LABELS[event.status]}
          </Badge>
          <span>{event.category_count} kategori</span>
          {event.venue && <span>{event.venue}</span>}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN KECIL: StatCard, InfoItem
// ═════════════════════════════════════════════════════

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: keyof typeof COLOR_MAP
}) {
  const colors = COLOR_MAP[color]

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
        <Icon className={`size-4 ${colors.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tracking-tight">{value}</p>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}</span>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ═════════════════════════════════════════════════════
// SKELETON
// ═════════════════════════════════════════════════════

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero card skeleton */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-52 rounded" />
            <Skeleton className="h-3 w-72 rounded" />
          </div>
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick links skeleton */}
      <div>
        <Skeleton className="mb-3 h-4 w-20 rounded" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
