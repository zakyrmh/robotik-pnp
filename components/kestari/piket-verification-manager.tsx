'use client'

/**
 * PiketVerificationManager — Verifikasi bukti piket anggota.
 *
 * Fitur:
 * - Filter: status (pending/approved/rejected), bulan
 * - Daftar submission dalam kartu
 * - Lihat foto sebelum/sesudah
 * - Tombol Approve / Reject (dengan alasan)
 */

import { useState, useTransition } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Image,
  Filter,
  Loader2,
  Eye,
  CalendarDays,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import {
  getPiketSubmissions,
  verifyPiketSubmission,
} from '@/app/actions/kestari.action'
import type { PiketPeriod, PiketSubmissionWithUser, PiketSubmissionStatus } from '@/lib/db/schema/kestari'
import { PIKET_SUBMISSION_STATUS_LABELS, WEEK_LABELS } from '@/lib/db/schema/kestari'

// ═══════════════════════════════════════════════

interface Props {
  period: PiketPeriod
  initialSubmissions: PiketSubmissionWithUser[]
}

const STATUS_COLORS: Record<PiketSubmissionStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-600 border-red-500/25',
}

export function PiketVerificationManager({ period, initialSubmissions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reload = () => {
    startTransition(async () => {
      const filters: { status?: PiketSubmissionStatus; monthYear?: string } = {}
      if (filterStatus !== 'all') filters.status = filterStatus as PiketSubmissionStatus
      if (filterMonth) filters.monthYear = filterMonth
      const result = await getPiketSubmissions(period.id, filters)
      setSubmissions(result.data ?? [])
    })
  }

  const handleVerify = (id: string, status: 'approved' | 'rejected', reason?: string) => {
    startTransition(async () => {
      const result = await verifyPiketSubmission(id, status, reason)
      if (result.error) {
        showFeedback('error', result.error)
      } else {
        showFeedback('success', `Bukti piket ${status === 'approved' ? 'disetujui' : 'ditolak'}.`)
        setRejectReason('')
        reload()
      }
    })
  }

  const handleFilter = () => reload()

  // Generate bulan options (6 bulan terakhir + 1 ke depan)
  const monthOptions: string[] = []
  const now = new Date()
  for (let i = -6; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="size-3" /> Bulan</Label>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Semua" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bulan</SelectItem>
              {monthOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleFilter} disabled={isPending} className="cursor-pointer">
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Filter className="size-3" />}
          Filter
        </Button>
      </div>

      {/* Daftar */}
      {submissions.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Clock className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Belum ada bukti piket</p>
          <p className="text-xs text-muted-foreground">Belum ada anggota yang mensubmit bukti piket.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Avatar */}
                <div className="size-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold shrink-0">
                  {(sub.full_name || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{sub.full_name}</p>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[sub.status]}`}>
                      {PIKET_SUBMISSION_STATUS_LABELS[sub.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {WEEK_LABELS[sub.assigned_week]} &middot; Piket: {sub.piket_date} &middot; Bulan: {sub.month_year}
                  </p>
                  {sub.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">&quot;{sub.notes}&quot;</p>
                  )}
                </div>

                {/* Foto */}
                <div className="flex gap-1.5 shrink-0">
                  {sub.photo_before_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(sub.photo_before_url)}
                      className="flex items-center gap-1 text-[10px] rounded-md border px-2 py-1 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <Image className="size-3" /> Sebelum
                    </button>
                  )}
                  {sub.photo_after_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(sub.photo_after_url)}
                      className="flex items-center gap-1 text-[10px] rounded-md border px-2 py-1 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <Image className="size-3" /> Sesudah
                    </button>
                  )}
                </div>

                {/* Aksi */}
                {sub.status === 'pending' && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleVerify(sub.id, 'approved')}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="size-3" /> Setuju
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs cursor-pointer border-red-500/30 text-red-600 hover:bg-red-500/10">
                          <XCircle className="size-3" /> Tolak
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tolak Bukti Piket?</AlertDialogTitle>
                          <AlertDialogDescription>Berikan alasan penolakan agar anggota bisa memperbaiki.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Alasan penolakan..."
                          className="min-h-[80px]"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={() => handleVerify(sub.id, 'rejected', rejectReason)}
                            disabled={isPending}
                            className="cursor-pointer"
                          >
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                            Tolak
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              {sub.reject_reason && sub.status === 'rejected' && (
                <div className="px-4 py-2 bg-red-500/5 border-t text-xs text-red-600">
                  <strong>Alasan ditolak:</strong> {sub.reject_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview foto modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Bukti piket" className="rounded-lg max-h-[80vh] object-contain" />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 bg-black/50 text-white border-white/20 cursor-pointer"
              onClick={() => setPreviewUrl(null)}
            >
              ✕ Tutup
            </Button>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
          feedback.type === 'error'
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        }`}>{feedback.msg}</div>
      )}
    </div>
  )
}

export function VerificationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-[150px] rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  )
}
