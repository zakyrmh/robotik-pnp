/**
 * Halaman Audit Logs Sistem — /dashboard/admin/audit
 *
 * Menampilkan log aktivitas perubahan data di sistem
 * dalam format timeline interaktif.
 *
 * Fitur:
 * - Timeline audit log dengan waktu relatif
 * - Filter berdasarkan tabel dan tipe aksi
 * - Detail perubahan (old vs new) yang bisa di-expand
 * - Paginasi "Muat Lebih Banyak"
 * - Statistik ringkasan (total log, tabel paling aktif)
 *
 * Catatan:
 * - Proteksi autentikasi dilakukan di layout.tsx (private)
 * - Data diambil server-side via server action
 * - Memerlukan permission 'audit:read' (hanya super_admin)
 */

import { Suspense } from 'react'
import { FileText, Database, Activity, Clock } from 'lucide-react'

import { getAuditLogs } from '@/app/actions/admin.action'
import {
  AuditLogTimeline,
  AuditLogSkeleton,
} from '@/components/admin/audit-log-timeline'

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
          <FileText className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Audit Logs Sistem
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau semua perubahan data penting yang terjadi di sistem.
          </p>
        </div>
      </div>

      {/* Konten dengan Suspense */}
      <Suspense fallback={<AuditPageSkeleton />}>
        <AuditPageContent />
      </Suspense>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN ASYNC: Loader konten halaman
// ═════════════════════════════════════════════════════

/**
 * AuditPageContent — Memuat data audit log awal secara server-side.
 * Data ini diteruskan ke komponen client AuditLogTimeline
 * agar filter dan paginasi bisa dikelola di client.
 */
async function AuditPageContent() {
  const result = await getAuditLogs({ limit: 20, offset: 0 })

  // Tampilkan error state
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

  const { logs, total } = result.data!

  // Hitung statistik ringkasan dari data awal
  const tableMap = new Map<string, number>()
  for (const log of logs) {
    tableMap.set(log.table_name, (tableMap.get(log.table_name) ?? 0) + 1)
  }
  const topTable = Array.from(tableMap.entries())
    .sort((a, b) => b[1] - a[1])[0]

  return (
    <>
      {/* Statistik ringkasan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatMini
          icon={Activity}
          label="Total Log"
          value={total.toString()}
          color="violet"
        />
        <StatMini
          icon={Database}
          label="Tabel Paling Aktif"
          value={topTable ? topTable[0] : '—'}
          color="blue"
        />
        <StatMini
          icon={Clock}
          label="Log Terbaru"
          value={
            logs.length > 0
              ? timeAgo(logs[0].created_at)
              : 'Belum ada'
          }
          color="emerald"
        />
      </div>

      {/* Timeline utama */}
      <AuditLogTimeline initialLogs={logs} initialTotal={total} />
    </>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Kartu statistik mini
// ═════════════════════════════════════════════════════

const MINI_COLORS = {
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
} as const

function StatMini({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: keyof typeof MINI_COLORS
}) {
  const colors = MINI_COLORS[color]

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
        <Icon className={`size-4 ${colors.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// UTILITY (duplikasi minimal — hanya dipakai di server component)
// ═════════════════════════════════════════════════════

/** Format waktu relatif */
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

// ═════════════════════════════════════════════════════
// KOMPONEN: Loading skeleton halaman
// ═════════════════════════════════════════════════════

function AuditPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="size-9 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-12 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <AuditLogSkeleton />
    </div>
  )
}
