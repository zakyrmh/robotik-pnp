'use client'

/**
 * ReductionReviewManager — Review pengajuan pengurangan poin.
 *
 * Fitur:
 * - Filter status: pending / approved / rejected
 * - Banner jumlah pending
 * - Kartu pengajuan: nama, poin diminta, alasan, bukti
 * - Approve: bisa partial (jumlah poin disetujui ≤ diminta) + catatan
 * - Reject: dengan catatan
 * - Tampilkan hasil review pada kartu yang sudah diproses
 */

import { useState, useTransition } from 'react'
import {
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
  Image,
  Zap,
  MessageSquareWarning,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  getPointReductions,
  reviewPointReduction,
} from '@/app/actions/komdis.action'
import type { KomdisPointReductionWithUser, KomdisReductionStatus } from '@/lib/db/schema/komdis'
import { KOMDIS_REDUCTION_STATUS_LABELS } from '@/lib/db/schema/komdis'

// ═══════════════════════════════════════════════

const STATUS_COLORS: Record<KomdisReductionStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-600 border-red-500/25',
}

interface Props {
  initialReductions: KomdisPointReductionWithUser[]
}

export function ReductionReviewManager({ initialReductions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [reductions, setReductions] = useState(initialReductions)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Review state per pengajuan
  const [reviewTarget, setReviewTarget] = useState<string | null>(null)
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve')
  const [approvedPoints, setApprovedPoints] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reload = () => {
    startTransition(async () => {
      const filters: { status?: KomdisReductionStatus } = {}
      if (filterStatus !== 'all') filters.status = filterStatus as KomdisReductionStatus
      const result = await getPointReductions(filters)
      setReductions(result.data ?? [])
    })
  }

  const handleReview = (id: string) => {
    startTransition(async () => {
      const pts = reviewMode === 'approve' ? (parseInt(approvedPoints) || undefined) : undefined
      const result = await reviewPointReduction(
        id,
        reviewMode === 'approve' ? 'approved' : 'rejected',
        pts,
        reviewNotes || undefined,
      )
      if (result.error) {
        showFeedback('error', result.error)
      } else {
        showFeedback('success', reviewMode === 'approve' ? 'Pengurangan poin disetujui.' : 'Pengajuan ditolak.')
        setReviewTarget(null)
        setReviewNotes('')
        setApprovedPoints('')
        reload()
      }
    })
  }

  const handleFilter = () => reload()

  const openReview = (id: string, mode: 'approve' | 'reject', requestedPoints: number) => {
    setReviewTarget(id)
    setReviewMode(mode)
    setApprovedPoints(String(requestedPoints))
    setReviewNotes('')
  }

  // Counts
  const pendingCount = reductions.filter((r) => r.status === 'pending').length

  // Display list
  const displayList = filterStatus === 'all'
    ? reductions
    : reductions.filter((r) => r.status === filterStatus)

  return (
    <div className="space-y-4">
      {/* Banner pending */}
      {pendingCount > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <strong>{pendingCount}</strong> pengajuan menunggu review
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu Review</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleFilter} disabled={isPending} className="cursor-pointer">
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Filter className="size-3" />}
          Filter
        </Button>
      </div>

      {/* Daftar */}
      {displayList.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <MessageSquareWarning className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Tidak ada pengajuan</p>
          <p className="text-xs text-muted-foreground">Belum ada pengajuan pengurangan poin.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayList.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-start gap-4 px-4 py-3">
                {/* Avatar */}
                <div className="size-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {(r.full_name || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{r.full_name}</p>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[r.status]}`}>
                      {KOMDIS_REDUCTION_STATUS_LABELS[r.status]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-sky-500/15 text-sky-600 border-sky-500/25">
                      <Zap className="size-2.5 mr-0.5" />
                      -{r.points} poin
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Diajukan: {new Date(r.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Bukti */}
                {r.evidence_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(r.evidence_url)}
                    className="flex items-center gap-1 text-[10px] rounded-md border px-2 py-1 hover:bg-accent/50 transition-colors cursor-pointer shrink-0"
                  >
                    <Image className="size-3" /> Bukti
                  </button>
                )}

                {/* Aksi (hanya untuk pending) */}
                {r.status === 'pending' && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => openReview(r.id, 'approve', r.points)}
                    >
                      <CheckCircle2 className="size-3" /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs cursor-pointer border-red-500/30 text-red-600 hover:bg-red-500/10"
                      onClick={() => openReview(r.id, 'reject', r.points)}
                    >
                      <XCircle className="size-3" /> Tolak
                    </Button>
                  </div>
                )}
              </div>

              {/* Hasil review (approved/rejected) */}
              {r.status !== 'pending' && r.reviewed_at && (
                <div className={`px-4 py-2 border-t text-xs ${
                  r.status === 'approved'
                    ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/5 text-red-600'
                }`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    {r.status === 'approved' && r.approved_points != null && (
                      <span className="font-medium">Disetujui: -{r.approved_points} poin</span>
                    )}
                    {r.review_notes && (
                      <span className="italic">&quot;{r.review_notes}&quot;</span>
                    )}
                    <span className="text-[10px] opacity-70 ml-auto">
                      {new Date(r.reviewed_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Form review inline */}
              {reviewTarget === r.id && (
                <div className="px-4 py-3 border-t bg-muted/20 space-y-2 animate-in slide-in-from-top-1">
                  <Label className="text-xs font-semibold">
                    {reviewMode === 'approve' ? '✅ Setujui Pengurangan' : '❌ Tolak Pengajuan'}
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {reviewMode === 'approve' && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Poin yang disetujui (maks: {r.points})</Label>
                        <Input
                          type="number"
                          min={1}
                          max={r.points}
                          value={approvedPoints}
                          onChange={(e) => setApprovedPoints(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Catatan</Label>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder={reviewMode === 'approve' ? 'Catatan persetujuan...' : 'Alasan penolakan...'}
                        className="min-h-[50px] text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReview(r.id)}
                      disabled={isPending}
                      className={`text-xs cursor-pointer ${
                        reviewMode === 'approve'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isPending ? <Loader2 className="size-3 animate-spin" /> : reviewMode === 'approve' ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                      {reviewMode === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setReviewTarget(null)} className="text-xs cursor-pointer">
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview bukti */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            <img src={previewUrl} alt="Bukti pendukung pengurangan poin" className="rounded-lg max-h-[80vh] object-contain" />
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

export function ReductionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  )
}
