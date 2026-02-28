/**
 * Halaman Super Admin Panel — /dashboard/admin
 *
 * Dashboard overview untuk Super Admin yang menampilkan:
 * - Statistik ringkasan (total user, aktif, nonaktif, banned)
 * - Distribusi role user dalam bentuk bar visual
 * - Daftar pendaftaran terbaru
 * - Quick links ke fitur admin lainnya
 *
 * Semua data diambil server-side secara paralel via server actions.
 * Layout menggunakan Bento Grid yang responsif.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import {
  Crown,
  Users,
  UserCheck,
  UserX,
  ShieldBan,
  KeyRound,
  FileText,
  ArrowRight,
  Clock,
} from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RoleBadge } from '@/components/admin/role-badge'
import { StatusBadge } from '@/components/admin/status-badge'

import {
  getAdminStats,
  getRecentUsers,
  type AdminStats,
  type RecentUser,
} from '@/app/actions/admin.action'

export default function SuperAdminPanelPage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Crown className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Super Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan sistem dan akses cepat ke fitur administrasi.
          </p>
        </div>
      </div>

      {/* Konten dashboard dengan Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN ASYNC: Loader konten dashboard
// ═════════════════════════════════════════════════════

/** Memuat data statistik dan user terbaru secara paralel */
async function DashboardContent() {
  const [statsResult, recentResult] = await Promise.all([
    getAdminStats(),
    getRecentUsers(),
  ])

  if (statsResult.error) {
    return <ErrorBanner message={statsResult.error} />
  }

  const stats = statsResult.data!
  const recentUsers = recentResult.data ?? []

  return (
    <>
      {/* Baris 1: Kartu statistik utama */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Pengguna"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Pengguna Aktif"
          value={stats.activeUsers}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          label="Pengguna Nonaktif"
          value={stats.inactiveUsers}
          icon={UserX}
          color="zinc"
        />
        <StatCard
          label="Pengguna Diblokir"
          value={stats.bannedUsers}
          icon={ShieldBan}
          color="red"
        />
      </div>

      {/* Baris 2: Distribusi Role + Pendaftaran Terbaru */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Distribusi Role (lebar) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Distribusi Role</h2>
            <span className="text-xs text-muted-foreground">
              {stats.totalRoles} role terdaftar
            </span>
          </div>
          <RoleDistribution
            distribution={stats.roleDistribution}
            totalUsers={stats.totalUsers}
          />
        </div>

        {/* Pendaftaran Terbaru (sempit) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pendaftaran Terbaru</h2>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <RecentUsersList users={recentUsers} />
        </div>
      </div>

      {/* Baris 3: Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          title="Manajemen Akun & Role"
          description="Kelola akun pengguna, ubah role, status, dan reset password."
          href="/dashboard/admin/roles"
          icon={KeyRound}
          color="amber"
        />
        <QuickLink
          title="Audit Logs Sistem"
          description="Pantau aktivitas dan perubahan yang terjadi di sistem."
          href="/dashboard/admin/audit"
          icon={FileText}
          color="violet"
        />
        <QuickLink
          title="Kembali ke Dashboard"
          description="Kembali ke halaman dashboard utama."
          href="/dashboard"
          icon={ArrowRight}
          color="zinc"
        />
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Kartu Statistik
// ═════════════════════════════════════════════════════

/** Peta warna untuk kartu statistik */
const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  zinc: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-600 dark:text-zinc-400',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
  },
} as const

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: keyof typeof COLOR_MAP
}) {
  const colors = COLOR_MAP[color]

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}>
        <Icon className={`size-5 ${colors.text}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Distribusi Role (Bar Visual)
// ═════════════════════════════════════════════════════

/** Peta warna bar per role */
const ROLE_BAR_COLORS: Record<string, string> = {
  super_admin: 'bg-amber-500',
  admin: 'bg-blue-500',
  pengurus: 'bg-violet-500',
  anggota: 'bg-emerald-500',
  calon_anggota: 'bg-zinc-400',
}

function RoleDistribution({
  distribution,
  totalUsers,
}: {
  distribution: AdminStats['roleDistribution']
  totalUsers: number
}) {
  if (distribution.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data distribusi role.
      </div>
    )
  }

  const maxCount = Math.max(...distribution.map((d) => d.count))

  return (
    <div className="space-y-3">
      {distribution.map((item) => {
        const percentage = totalUsers > 0 ? (item.count / totalUsers) * 100 : 0
        const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0
        const barColor = ROLE_BAR_COLORS[item.name] ?? 'bg-zinc-400'

        return (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <RoleBadge role={item.name} />
              <span className="text-xs tabular-nums text-muted-foreground">
                {item.count} user ({percentage.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Daftar Pendaftaran Terbaru
// ═════════════════════════════════════════════════════

/** Menghasilkan inisial dari nama */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

/** Format waktu relatif (contoh: "2 jam lalu") */
function timeAgo(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 30) return `${days} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

function RecentUsersList({ users }: { users: RecentUser[] }) {
  if (users.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada pendaftaran.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {users.map((user, idx) => {
        const fullName = user.profiles?.full_name ?? 'Tanpa Nama'
        return (
          <div key={user.id}>
            <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={user.profiles?.avatar_url ?? undefined}
                  alt={fullName}
                />
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-medium text-primary">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={user.status} />
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(user.created_at)}
                </span>
              </div>
            </div>
            {idx < users.length - 1 && <Separator className="my-1" />}
          </div>
        )
      })}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Quick Links
// ═════════════════════════════════════════════════════

function QuickLink({
  title,
  description,
  href,
  icon: Icon,
  color,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: keyof typeof COLOR_MAP
}) {
  const colors = COLOR_MAP[color]

  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}>
        <Icon className={`size-5 ${colors.text}`} />
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
// KOMPONEN: Error Banner
// ═════════════════════════════════════════════════════

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Silakan muat ulang halaman atau hubungi administrator.
      </p>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Loading Skeleton
// ═════════════════════════════════════════════════════

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-7 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-4">
          <Skeleton className="mb-4 h-4 w-32 rounded" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-3">
          <Skeleton className="mb-4 h-4 w-36 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
