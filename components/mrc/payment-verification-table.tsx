'use client'

/**
 * PaymentVerificationTable — Komponen client untuk verifikasi
 * pembayaran pendaftaran tim peserta MRC.
 *
 * Fitur:
 * - Filter event
 * - Tabel tim + status pembayaran
 * - Lihat bukti pembayaran (link ke file)
 * - Verifikasi / tolak pembayaran
 * - Auto-update status tim ke payment_verified jika pembayaran valid
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  Clock,
  ImageIcon,
  Building2,
  Filter,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  getTeamsForPayment,
  verifyPayment,
  type TeamForPayment,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type { MrcPayment } from '@/lib/db/schema/mrc'
import { MRC_PAYMENT_STATUS_LABELS, type MrcPaymentStatus } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KONSTANTA
// ═════════════════════════════════════════════════════

const PAYMENT_STATUS_CONFIG: Record<MrcPaymentStatus, { className: string }> = {
  pending: { className: 'bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400' },
  verified: { className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400' },
  rejected: { className: 'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400' },
}

/** Format angka ke Rupiah */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

/** Format tanggal singkat */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface PaymentVerificationTableProps {
  events: MrcEventWithStats[]
}

export function PaymentVerificationTable({ events }: PaymentVerificationTableProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [teams, setTeams] = useState<TeamForPayment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'; message: string
  } | null>(null)

  const loadTeams = useCallback(
    (eventId: string) => {
      setLoaded(false)
      startTransition(async () => {
        const result = await getTeamsForPayment(eventId)
        if (result.data) setTeams(result.data)
        setLoaded(true)
      })
    },
    [startTransition]
  )

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    setFeedback(null)
    loadTeams(id)
  }

  // Auto-load pertama via useEffect
  useEffect(() => {
    if (selectedEventId) loadTeams(selectedEventId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Aksi verifikasi pembayaran */
  const handleVerify = (
    paymentId: string, teamId: string, teamName: string,
    status: 'verified' | 'rejected', reason?: string
  ) => {
    startTransition(async () => {
      setFeedback(null)
      const result = await verifyPayment(paymentId, teamId, status, reason ?? null)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({
          type: 'success',
          message: `Pembayaran tim "${teamName}" ${status === 'verified' ? 'terverifikasi' : 'ditolak'}.`,
        })
        loadTeams(selectedEventId)
      }
    })
  }

  // Statistik
  const totalTeams = teams.length
  const pendingPayments = teams.filter((t) =>
    t.payments.some((p) => p.status === 'pending')
  ).length
  const verifiedPayments = teams.filter((t) =>
    t.payments.some((p) => p.status === 'verified')
  ).length
  const totalRevenue = teams
    .filter((t) => t.payments.some((p) => p.status === 'verified'))
    .reduce((sum, t) => sum + t.registration_fee, 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" /> Event
          </Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Building2} label="Tim Eligible" value={totalTeams.toString()} color="blue" />
        <MiniStat icon={Clock} label="Menunggu Verifikasi" value={pendingPayments.toString()} color="amber" />
        <MiniStat icon={CheckCircle2} label="Terverifikasi" value={verifiedPayments.toString()} color="emerald" />
        <MiniStat icon={Banknote} label="Total Pemasukan" value={formatRupiah(totalRevenue)} color="violet" />
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
          feedback.type === 'error'
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        }`}>{feedback.message}</div>
      )}

      {/* Tabel */}
      {!loaded && isPending ? (
        <PaymentTableSkeleton />
      ) : teams.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tim</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Biaya</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <PaymentRow
                  key={team.id}
                  team={team}
                  isPending={isPending}
                  onVerify={handleVerify}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Baris pembayaran
// ═════════════════════════════════════════════════════

function PaymentRow({
  team,
  isPending,
  onVerify,
}: {
  team: TeamForPayment
  isPending: boolean
  onVerify: (paymentId: string, teamId: string, teamName: string, status: 'verified' | 'rejected', reason?: string) => void
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  // Ambil pembayaran terbaru
  const latestPayment = team.payments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] as MrcPayment | undefined

  return (
    <TableRow>
      {/* Tim */}
      <TableCell>
        <div className="min-w-[140px]">
          <p className="text-sm font-medium">{team.team_name}</p>
          <p className="text-xs text-muted-foreground">{team.institution}</p>
        </div>
      </TableCell>

      {/* Kategori */}
      <TableCell className="text-sm">{team.category_name}</TableCell>

      {/* Biaya */}
      <TableCell className="text-right font-mono text-sm whitespace-nowrap">
        {formatRupiah(team.registration_fee)}
      </TableCell>

      {/* Status pembayaran */}
      <TableCell>
        {latestPayment ? (
          <div className="space-y-1 min-w-[160px]">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PAYMENT_STATUS_CONFIG[latestPayment.status as MrcPaymentStatus]?.className}`}>
                {MRC_PAYMENT_STATUS_LABELS[latestPayment.status as MrcPaymentStatus]}
              </Badge>
              <a
                href={latestPayment.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                <ImageIcon className="size-3" /> Bukti
              </a>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {formatRupiah(latestPayment.amount)} · {latestPayment.payment_method ?? '—'} · {formatDate(latestPayment.created_at)}
            </p>
            {latestPayment.account_name && (
              <p className="text-[11px] text-muted-foreground">a.n. {latestPayment.account_name}</p>
            )}
            {latestPayment.rejection_reason && (
              <p className="text-[11px] text-red-600 dark:text-red-400">{latestPayment.rejection_reason}</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Belum upload bukti</span>
        )}
      </TableCell>

      {/* Aksi */}
      <TableCell className="text-right">
        {latestPayment && latestPayment.status === 'pending' ? (
          <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-7 text-xs cursor-pointer"
                disabled={isPending}
                onClick={() => onVerify(latestPayment.id, team.id, team.team_name, 'verified')}
              >
                {isPending ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                Verifikasi
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive cursor-pointer"
                disabled={isPending}
                onClick={() => setShowReject(!showReject)}
              >
                <XCircle className="size-3" />
              </Button>
            </div>
            {showReject && (
              <div className="flex gap-1 w-full">
                <Input
                  className="h-7 text-xs flex-1"
                  placeholder="Alasan tolak..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs cursor-pointer"
                  disabled={isPending || !rejectReason.trim()}
                  onClick={() => {
                    onVerify(latestPayment.id, team.id, team.team_name, 'rejected', rejectReason)
                    setShowReject(false)
                    setRejectReason('')
                  }}
                >
                  Tolak
                </Button>
              </div>
            )}
          </div>
        ) : latestPayment?.status === 'verified' ? (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400">
            ✓ Verified
          </Badge>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN KECIL
// ═════════════════════════════════════════════════════

const MINI_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
}

function MiniStat({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string; color: string
}) {
  const c = MINI_COLORS[color] ?? MINI_COLORS.blue
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
        <Icon className={`size-4 ${c.text}`} />
      </div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-semibold truncate">{value}</p></div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted"><Banknote className="size-6 text-muted-foreground" /></div>
      <p className="text-sm font-medium">Belum ada tim yang perlu diverifikasi</p>
      <p className="text-xs text-muted-foreground max-w-[300px]">
        Tim akan muncul di sini setelah berkas mereka terverifikasi dan mereka mengupload bukti pembayaran.
      </p>
    </div>
  )
}

function PaymentTableSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32 rounded" /><Skeleton className="h-3 w-40 rounded" /></div>
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-7 w-20 rounded" />
        </div>
      ))}
    </div>
  )
}

export function PaymentVerificationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[240px] rounded-md" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="size-9 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-3 w-20 rounded" /><Skeleton className="h-4 w-12 rounded" /></div>
          </div>
        ))}
      </div>
      <PaymentTableSkeleton />
    </div>
  )
}
