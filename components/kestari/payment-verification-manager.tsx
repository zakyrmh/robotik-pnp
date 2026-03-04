'use client'

/**
 * PaymentVerificationManager — Verifikasi pembayaran denda piket.
 *
 * Fitur:
 * - Filter: status (pending_verification/unpaid/paid/waived), bulan
 * - Daftar denda dalam kartu
 * - Lihat bukti pembayaran
 * - Tombol Verifikasi Lunas / Bebaskan (dispensasi)
 */

import { useState, useTransition } from 'react'
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  CalendarDays,
  Banknote,
  Image,
  Ban,
  Receipt,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
  getPiketFines,
  verifyFinePayment,
} from '@/app/actions/kestari.action'
import type { PiketPeriod, PiketFineWithUser, PiketFineStatus } from '@/lib/db/schema/kestari'
import { PIKET_FINE_STATUS_LABELS } from '@/lib/db/schema/kestari'

// ═══════════════════════════════════════════════

interface Props {
  period: PiketPeriod
  initialFines: PiketFineWithUser[]
}

const STATUS_COLORS: Record<PiketFineStatus, string> = {
  unpaid: 'bg-red-500/15 text-red-600 border-red-500/25',
  pending_verification: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  paid: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  waived: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25',
}

export function PaymentVerificationManager({ period, initialFines }: Props) {
  const [isPending, startTransition] = useTransition()
  const [fines, setFines] = useState(initialFines)
  const [filterStatus, setFilterStatus] = useState<string>('pending_verification')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reload = () => {
    startTransition(async () => {
      const filters: { status?: PiketFineStatus; monthYear?: string } = {}
      if (filterStatus !== 'all') filters.status = filterStatus as PiketFineStatus
      if (filterMonth !== 'all') filters.monthYear = filterMonth
      const result = await getPiketFines(period.id, filters)
      setFines(result.data ?? [])
    })
  }

  const handleVerify = (fineId: string, status: 'paid' | 'waived') => {
    startTransition(async () => {
      const result = await verifyFinePayment(fineId, status)
      if (result.error) {
        showFeedback('error', result.error)
      } else {
        showFeedback('success', status === 'paid' ? 'Pembayaran diverifikasi.' : 'Denda dibebaskan.')
        reload()
      }
    })
  }

  const handleFilter = () => reload()

  // Bulan options
  const monthOptions: string[] = []
  const now = new Date()
  for (let i = -6; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Filter display
  const displayFines = fines.filter((f) => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false
    if (filterMonth !== 'all' && f.month_year !== filterMonth) return false
    return true
  })

  // Stats
  const pendingCount = fines.filter((f) => f.status === 'pending_verification').length

  return (
    <div className="space-y-4">
      {/* Stats */}
      {pendingCount > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <strong>{pendingCount}</strong> pembayaran menunggu verifikasi
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
              <SelectItem value="pending_verification">Menunggu Verifikasi</SelectItem>
              <SelectItem value="unpaid">Belum Bayar</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="waived">Dibebaskan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="size-3" /> Bulan</Label>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Semua" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
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
      {displayFines.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Receipt className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Tidak ada data</p>
          <p className="text-xs text-muted-foreground">Tidak ada denda dengan filter yang dipilih.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayFines.map((f) => (
            <div key={f.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Avatar */}
                <div className="size-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold shrink-0">
                  {(f.full_name || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{f.full_name}</p>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[f.status]}`}>
                      {PIKET_FINE_STATUS_LABELS[f.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bulan: {f.month_year} &middot;{' '}
                    <span className="font-medium">Rp {f.amount.toLocaleString('id-ID')}</span>
                  </p>
                </div>

                {/* Bukti */}
                {f.payment_proof_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(f.payment_proof_url)}
                    className="flex items-center gap-1 text-[10px] rounded-md border px-2 py-1 hover:bg-accent/50 transition-colors cursor-pointer shrink-0"
                  >
                    <Image className="size-3" /> Bukti Bayar
                  </button>
                )}

                {/* Aksi */}
                {(f.status === 'pending_verification' || f.status === 'unpaid') && (
                  <div className="flex gap-1.5 shrink-0">
                    {f.status === 'pending_verification' && (
                      <Button
                        size="sm"
                        className="text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleVerify(f.id, 'paid')}
                        disabled={isPending}
                      >
                        <CheckCircle2 className="size-3" /> Verifikasi Lunas
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs cursor-pointer">
                          <Ban className="size-3" /> Bebaskan
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bebaskan Denda?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Denda Rp {f.amount.toLocaleString('id-ID')} untuk {f.full_name} di bulan {f.month_year} akan dibebaskan (dispensasi).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <Button onClick={() => handleVerify(f.id, 'waived')} disabled={isPending} className="cursor-pointer">
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                            Bebaskan
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview foto */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Bukti pembayaran" className="rounded-lg max-h-[80vh] object-contain" />
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

export function PaymentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-9 w-[150px] rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  )
}
