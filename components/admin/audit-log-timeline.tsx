'use client'

/**
 * AuditLogTimeline — Komponen client-side untuk menampilkan
 * audit logs dalam format timeline dengan filter.
 *
 * Fitur:
 * - Filter berdasarkan tabel (users, profiles, user_roles)
 * - Filter berdasarkan aksi (INSERT, UPDATE, DELETE)
 * - Paginasi "Muat Lebih Banyak"
 * - Tampilan detail perubahan (old vs new) via expand
 * - Waktu relatif (contoh: "5 menit lalu")
 */

import { useState, useTransition } from 'react'
import {
  Filter,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ScrollText,
  UserCircle,
  Bot,
} from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { getAuditLogs } from '@/app/actions/admin.action'
import type { AuditLogWithActor } from '@/lib/types/admin'

// ═════════════════════════════════════════════════════
// KONSTANTA
// ═════════════════════════════════════════════════════

/** Opsi filter tabel */
const TABLE_OPTIONS = [
  { value: 'all', label: 'Semua Tabel' },
  { value: 'users', label: 'Users' },
  { value: 'profiles', label: 'Profiles' },
  { value: 'user_roles', label: 'User Roles' },
] as const

/** Opsi filter aksi */
const ACTION_OPTIONS = [
  { value: 'all', label: 'Semua Aksi' },
  { value: 'INSERT', label: 'Insert' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
] as const

/** Konfigurasi visual untuk setiap aksi */
const ACTION_CONFIG = {
  INSERT: {
    icon: Plus,
    label: 'Insert',
    className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  UPDATE: {
    icon: Pencil,
    label: 'Update',
    className: 'bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
  DELETE: {
    icon: Trash2,
    label: 'Delete',
    className: 'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
} as const

/** Items per page */
const PAGE_SIZE = 20

// ═════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════

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
    year: 'numeric',
  })
}

/** Format tanggal lengkap */
function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Menghasilkan inisial dari nama */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface AuditLogTimelineProps {
  /** Data log awal yang dimuat di server */
  initialLogs: AuditLogWithActor[]
  /** Total jumlah log di database */
  initialTotal: number
}

export function AuditLogTimeline({
  initialLogs,
  initialTotal,
}: AuditLogTimelineProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [isPending, startTransition] = useTransition()

  // Filter state
  const [tableFilter, setTableFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  // Paginasi
  const [offset, setOffset] = useState(PAGE_SIZE)
  const hasMore = logs.length < total

  /** Terapkan filter — reset list dan muat ulang dari awal */
  const applyFilters = (newTable: string, newAction: string) => {
    setTableFilter(newTable)
    setActionFilter(newAction)

    startTransition(async () => {
      const result = await getAuditLogs({
        tableName: newTable === 'all' ? undefined : newTable,
        action: newAction === 'all' ? undefined : (newAction as 'INSERT' | 'UPDATE' | 'DELETE'),
        limit: PAGE_SIZE,
        offset: 0,
      })

      if (result.data) {
        setLogs(result.data.logs)
        setTotal(result.data.total)
        setOffset(PAGE_SIZE)
      }
    })
  }

  /** Muat lebih banyak (append ke list) */
  const loadMore = () => {
    startTransition(async () => {
      const result = await getAuditLogs({
        tableName: tableFilter === 'all' ? undefined : tableFilter,
        action: actionFilter === 'all' ? undefined : (actionFilter as 'INSERT' | 'UPDATE' | 'DELETE'),
        limit: PAGE_SIZE,
        offset,
      })

      if (result.data) {
        setLogs((prev) => [...prev, ...result.data!.logs])
        setTotal(result.data.total)
        setOffset((prev) => prev + PAGE_SIZE)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          <span className="hidden sm:inline">Filter:</span>
        </div>
        <Select
          value={tableFilter}
          onValueChange={(v) => applyFilters(v, actionFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TABLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={actionFilter}
          onValueChange={(v) => applyFilters(tableFilter, v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {total} log ditemukan
        </span>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border bg-card shadow-sm">
        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Tombol "Muat Lebih Banyak" */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={isPending}
            onClick={loadMore}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            Muat Lebih Banyak
          </Button>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Satu baris log entry
// ═════════════════════════════════════════════════════

function LogEntry({ log }: { log: AuditLogWithActor }) {
  const [expanded, setExpanded] = useState(false)
  const config = ACTION_CONFIG[log.action]
  const ActionIcon = config.icon
  const actorName = log.actor_profile?.full_name ?? null
  const hasDetailData = log.old_data || log.new_data

  return (
    <div className="group">
      {/* Baris utama */}
      <button
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 cursor-pointer"
        onClick={() => hasDetailData && setExpanded(!expanded)}
        disabled={!hasDetailData}
        type="button"
      >
        {/* Timeline dot */}
        <div className="relative mt-1.5 flex flex-col items-center">
          <div className={`size-2.5 rounded-full ${config.dotColor}`} />
        </div>

        {/* Konten utama */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Summary + Badge aksi */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {log.summary ?? `${log.action} pada ${log.table_name}`}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-medium px-1.5 py-0 ${config.className}`}
            >
              <ActionIcon className="mr-1 size-3" />
              {config.label}
            </Badge>
          </div>

          {/* Meta: tabel, actor, waktu */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
              {log.table_name}
            </code>
            <span className="flex items-center gap-1">
              {actorName ? (
                <>
                  <Avatar className="size-4">
                    <AvatarImage
                      src={log.actor_profile?.avatar_url ?? undefined}
                      alt={actorName}
                    />
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                      {getInitials(actorName)}
                    </AvatarFallback>
                  </Avatar>
                  {actorName}
                </>
              ) : (
                <>
                  <Bot className="size-3" />
                  Sistem
                </>
              )}
            </span>
            <span title={formatFullDate(log.created_at)}>
              {timeAgo(log.created_at)}
            </span>
          </div>
        </div>

        {/* Expand icon */}
        {hasDetailData && (
          <div className="mt-1.5 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </div>
        )}
      </button>

      {/* Detail data (expanded) */}
      {expanded && hasDetailData && (
        <div className="border-t bg-muted/30 px-4 py-3 ml-7">
          <DataDiff oldData={log.old_data} newData={log.new_data} />
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Detail perubahan data (diff view)
// ═════════════════════════════════════════════════════

/** Kolom sensitif yang tidak ditampilkan di detail */
const HIDDEN_FIELDS = new Set(['id', 'created_at', 'updated_at'])

function DataDiff({
  oldData,
  newData,
}: {
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
}) {
  // Kumpulkan semua key unik dari kedua sumber
  const allKeys = new Set([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ])

  // Filter key sensitif dan yang tidak berubah
  const changedKeys = Array.from(allKeys).filter((key) => {
    if (HIDDEN_FIELDS.has(key)) return false
    const oldVal = oldData?.[key]
    const newVal = newData?.[key]
    return JSON.stringify(oldVal) !== JSON.stringify(newVal)
  })

  if (changedKeys.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Tidak ada perubahan field yang terdeteksi.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Perubahan ({changedKeys.length} field):
      </p>
      <div className="grid gap-1.5">
        {changedKeys.map((key) => {
          const oldVal = formatValue(oldData?.[key])
          const newVal = formatValue(newData?.[key])

          return (
            <div
              key={key}
              className="flex flex-wrap items-start gap-2 rounded-lg bg-background px-3 py-2 text-xs"
            >
              <code className="font-semibold text-foreground shrink-0">
                {key}
              </code>
              {oldData && (
                <span className="text-red-600 dark:text-red-400 break-all">
                  − {oldVal}
                </span>
              )}
              {newData && (
                <span className="text-emerald-600 dark:text-emerald-400 break-all">
                  + {newVal}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Format value untuk tampilan (handle null, object, dll) */
function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Empty State
// ═════════════════════════════════════════════════════

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <ScrollText className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Belum ada audit log</p>
      <p className="text-xs text-muted-foreground max-w-[280px]">
        Log aktivitas akan muncul di sini saat terjadi perubahan data di sistem.
      </p>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Loading Skeleton
// ═════════════════════════════════════════════════════

export function AuditLogSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-9 w-[160px] rounded-md" />
        <Skeleton className="h-9 w-[140px] rounded-md" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* Timeline skeleton */}
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="mt-1.5 size-2.5 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
