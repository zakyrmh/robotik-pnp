'use client'

/**
 * TeamVerificationTable — Komponen client untuk verifikasi
 * berkas dan kelengkapan tim peserta MRC.
 *
 * Fitur:
 * - Filter berdasarkan event dan status verifikasi
 * - Tabel tim: nama, institusi, kategori, ketua, anggota, status
 * - Expand detail: daftar anggota tim, info kontak, pembimbing
 * - Aksi verifikasi: setujui / minta revisi / tolak
 * - Field alasan wajib untuk revisi/penolakan
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Users,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Shield,
  Clock,
  Filter,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  getTeamsForVerification,
  updateTeamDocStatus,
  type TeamForVerification,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import {
  MRC_TEAM_STATUS_LABELS,
  MRC_MEMBER_ROLE_LABELS,
  type MrcTeamStatus,
} from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KONSTANTA
// ═════════════════════════════════════════════════════

/** Konfigurasi visual status tim */
const TEAM_STATUS_CONFIG: Record<MrcTeamStatus, { className: string }> = {
  pending: { className: 'bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400' },
  revision: { className: 'bg-orange-500/15 text-orange-700 border-orange-500/25 dark:text-orange-400' },
  documents_verified: { className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400' },
  payment_verified: { className: 'bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400' },
  checked_in: { className: 'bg-violet-500/15 text-violet-700 border-violet-500/25 dark:text-violet-400' },
  rejected: { className: 'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400' },
}

/** Opsi filter status untuk berkas */
const DOC_STATUS_FILTER = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'revision', label: 'Perlu Revisi' },
  { value: 'documents_verified', label: 'Terverifikasi' },
  { value: 'rejected', label: 'Ditolak' },
] as const

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface TeamVerificationTableProps {
  events: MrcEventWithStats[]
}

export function TeamVerificationTable({ events }: TeamVerificationTableProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [teams, setTeams] = useState<TeamForVerification[]>([])
  const [loaded, setLoaded] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'; message: string
  } | null>(null)

  /** Muat data tim */
  const loadTeams = useCallback(
    (eventId: string, status?: string) => {
      setLoaded(false)
      startTransition(async () => {
        const result = await getTeamsForVerification(
          eventId,
          status === 'all' ? undefined : (status as MrcTeamStatus)
        )
        if (result.data) {
          setTeams(result.data)
        }
        setLoaded(true)
      })
    },
    [startTransition]
  )

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    setFeedback(null)
    loadTeams(id, statusFilter)
  }

  const handleStatusChange = (s: string) => {
    setStatusFilter(s)
    setFeedback(null)
    loadTeams(selectedEventId, s)
  }

  /** Auto-load pertama via useEffect */
  useEffect(() => {
    if (selectedEventId) {
      loadTeams(selectedEventId, statusFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Aksi verifikasi */
  const handleVerify = (
    teamId: string,
    teamName: string,
    status: 'documents_verified' | 'revision' | 'rejected',
    reason?: string,
    notes?: string
  ) => {
    startTransition(async () => {
      setFeedback(null)
      const result = await updateTeamDocStatus(
        teamId, status, reason ?? null, notes ?? null
      )
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        const label = status === 'documents_verified' ? 'diverifikasi'
          : status === 'revision' ? 'diminta revisi' : 'ditolak'
        setFeedback({
          type: 'success',
          message: `Tim "${teamName}" berhasil ${label}.`,
        })
        loadTeams(selectedEventId, statusFilter)
      }
    })
  }

  // Statistik cepat
  const pendingCount = teams.filter((t) => t.status === 'pending').length
  const revisionCount = teams.filter((t) => t.status === 'revision').length
  const verifiedCount = teams.filter((t) => t.status === 'documents_verified').length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Event</Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" /> Status
          </Label>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_STATUS_FILTER.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat icon={Clock} label="Menunggu" value={pendingCount} color="amber" />
        <MiniStat icon={RotateCcw} label="Perlu Revisi" value={revisionCount} color="orange" />
        <MiniStat icon={CheckCircle2} label="Terverifikasi" value={verifiedCount} color="emerald" />
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
          feedback.type === 'error'
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        }`}>{feedback.message}</div>
      )}

      {/* Tim list */}
      {!loaded && isPending ? (
        <VerificationSkeleton />
      ) : teams.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isExpanded={expandedId === team.id}
              onToggle={() => setExpandedId(expandedId === team.id ? null : team.id)}
              isPending={isPending}
              onVerify={handleVerify}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Card tim
// ═════════════════════════════════════════════════════

function TeamCard({
  team,
  isExpanded,
  onToggle,
  isPending,
  onVerify,
}: {
  team: TeamForVerification
  isExpanded: boolean
  onToggle: () => void
  isPending: boolean
  onVerify: (id: string, name: string, status: 'documents_verified' | 'revision' | 'rejected', reason?: string, notes?: string) => void
}) {
  const [reason, setReason] = useState(team.rejection_reason ?? '')
  const statusConfig = TEAM_STATUS_CONFIG[team.status]
  const canVerify = ['pending', 'revision'].includes(team.status)

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{team.team_name}</p>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConfig.className}`}>
              {MRC_TEAM_STATUS_LABELS[team.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Building2 className="size-3" />{team.institution}</span>
            <span className="flex items-center gap-1"><Shield className="size-3" />{team.category_name}</span>
            <span className="flex items-center gap-1"><Users className="size-3" />{team.member_count} anggota</span>
          </div>
        </div>
        <ChevronRight className={`size-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Detail */}
      {isExpanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {/* Kontak */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 text-xs">
              <p className="font-medium">Ketua Tim</p>
              <p className="flex items-center gap-1.5"><Users className="size-3 text-muted-foreground" />{team.captain_name}</p>
              <p className="flex items-center gap-1.5"><Mail className="size-3 text-muted-foreground" />{team.captain_email}</p>
              <p className="flex items-center gap-1.5"><Phone className="size-3 text-muted-foreground" />{team.captain_phone}</p>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="font-medium">Pembimbing</p>
              <p className="flex items-center gap-1.5"><GraduationCap className="size-3 text-muted-foreground" />{team.advisor_name}</p>
            </div>
          </div>

          <Separator />

          {/* Daftar anggota */}
          <div>
            <p className="text-xs font-medium mb-2">Anggota Tim ({team.member_count})</p>
            {team.members.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Belum ada anggota terdaftar.</p>
            ) : (
              <div className="rounded-lg border bg-background divide-y">
                {team.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div>
                      <span className="font-medium">{m.full_name}</span>
                      {m.identity_number && (
                        <span className="text-muted-foreground ml-2">({m.identity_number})</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {MRC_MEMBER_ROLE_LABELS[m.role]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catatan revisi/penolakan */}
          {team.rejection_reason && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <span className="font-medium">Catatan: </span>{team.rejection_reason}
            </div>
          )}

          {/* Aksi verifikasi */}
          {canVerify && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Alasan Revisi / Penolakan</Label>
                  <Input
                    className="text-sm"
                    placeholder="Isi alasan jika minta revisi atau menolak..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="cursor-pointer"
                    disabled={isPending}
                    onClick={() => onVerify(team.id, team.team_name, 'documents_verified')}
                  >
                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                    Verifikasi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={isPending || !reason.trim()}
                    onClick={() => onVerify(team.id, team.team_name, 'revision', reason)}
                  >
                    <RotateCcw className="size-3.5" />
                    Minta Revisi
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="cursor-pointer"
                    disabled={isPending || !reason.trim()}
                    onClick={() => onVerify(team.id, team.team_name, 'rejected', reason)}
                  >
                    <XCircle className="size-3.5" />
                    Tolak
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN KECIL
// ═════════════════════════════════════════════════════

const MINI_COLORS: Record<string, { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
}

function MiniStat({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number; color: string
}) {
  const c = MINI_COLORS[color] ?? MINI_COLORS.amber
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
        <Icon className={`size-4 ${c.text}`} />
      </div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold">{value}</p></div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Users className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Belum ada tim terdaftar</p>
      <p className="text-xs text-muted-foreground max-w-[280px]">
        Tim peserta akan muncul di sini setelah mendaftar melalui form pendaftaran.
      </p>
    </div>
  )
}

function VerificationSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="flex gap-3"><Skeleton className="h-3 w-24 rounded" /><Skeleton className="h-3 w-20 rounded" /></div>
          </div>
          <Skeleton className="size-4 rounded" />
        </div>
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// SKELETON HALAMAN (Export)
// ═════════════════════════════════════════════════════

export function TeamVerificationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[240px] rounded-md" /></div>
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[180px] rounded-md" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="size-9 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-3 w-16 rounded" /><Skeleton className="h-5 w-8 rounded" /></div>
          </div>
        ))}
      </div>
      <VerificationSkeleton />
    </div>
  )
}
