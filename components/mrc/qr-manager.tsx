'use client'

/**
 * QrManager — Komponen client untuk generate dan cetak
 * QR code kokarde peserta MRC.
 *
 * Fitur:
 * - Pilih event dan klik Generate untuk membuat QR batch
 * - Tabel daftar QR: nama, tim, role, token, status
 * - Cetak kokarde (area print-friendly dengan QR + identitas)
 * - QR code ditampilkan sebagai teks token (gunakan barcode scanner)
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  QrCode,
  Printer,
  RefreshCw,
  Loader2,
  Users,
  CheckCircle2,
  Filter,
  Zap,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  generateQrCodesForEvent,
  getQrCodesForEvent,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type { MrcQrCodeWithTeam } from '@/lib/db/schema/mrc'
import { MRC_MEMBER_ROLE_LABELS } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

export function QrManager({ events }: { events: MrcEventWithStats[] }) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [qrCodes, setQrCodes] = useState<MrcQrCodeWithTeam[]>([])
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'; message: string
  } | null>(null)

  /** Muat QR codes */
  const loadQr = useCallback(
    (eventId: string) => {
      startTransition(async () => {
        const result = await getQrCodesForEvent(eventId)
        if (result.data) setQrCodes(result.data)
      })
    },
    [startTransition]
  )

  useEffect(() => {
    if (selectedEventId) loadQr(selectedEventId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Generate QR codes batch */
  const handleGenerate = () => {
    setFeedback(null)
    startTransition(async () => {
      const result = await generateQrCodesForEvent(selectedEventId)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else if (result.data) {
        setFeedback({
          type: 'success',
          message: `${result.data.generated} QR code berhasil dibuat. ${result.data.skipped} sudah ada sebelumnya.`,
        })
        loadQr(selectedEventId)
      }
    })
  }

  /** Cetak kokarde via print dialog browser */
  const handlePrint = () => {
    window.print()
  }

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    setFeedback(null)
    loadQr(id)
  }

  const checkedInCount = qrCodes.filter((q) => q.is_checked_in).length

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
        <Button onClick={handleGenerate} disabled={isPending} className="cursor-pointer">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
          Generate QR
        </Button>
        {qrCodes.length > 0 && (
          <Button variant="outline" onClick={handlePrint} className="cursor-pointer print:hidden">
            <Printer className="size-4" />
            Cetak Kokarde
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => loadQr(selectedEventId)} disabled={isPending} className="cursor-pointer print:hidden">
          <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3 print:hidden">
        <MiniStat icon={QrCode} label="Total QR" value={qrCodes.length} color="blue" />
        <MiniStat icon={CheckCircle2} label="Sudah Check-in" value={checkedInCount} color="emerald" />
        <MiniStat icon={Users} label="Belum Check-in" value={qrCodes.length - checkedInCount} color="amber" />
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 print:hidden ${
          feedback.type === 'error'
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        }`}>{feedback.message}</div>
      )}

      {/* Tabel QR (tampilan layar) */}
      {qrCodes.length === 0 ? (
        <QrEmptyState />
      ) : (
        <>
          {/* Tabel untuk layar */}
          <div className="rounded-xl border bg-card shadow-sm overflow-x-auto print:hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tim</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="font-mono">Token QR</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell className="font-medium text-sm">{qr.person_name}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p>{qr.team_name}</p>
                        <p className="text-muted-foreground">{qr.institution}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {MRC_MEMBER_ROLE_LABELS[qr.person_role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{qr.qr_token}</TableCell>
                    <TableCell className="text-center">
                      {qr.is_checked_in ? (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/15 text-emerald-700 border-emerald-500/25">
                          ✓ Check-in
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-zinc-500/15 text-zinc-500 border-zinc-500/25">
                          Belum
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Area cetak kokarde (hanya tampil saat print) */}
          <div className="hidden print:block">
            <div className="grid grid-cols-2 gap-4">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="border border-black rounded-lg p-4 break-inside-avoid text-center">
                  <p className="text-lg font-bold mb-1">{qr.person_name}</p>
                  <p className="text-sm">{qr.team_name}</p>
                  <p className="text-xs text-gray-600">{qr.institution} · {qr.category_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{MRC_MEMBER_ROLE_LABELS[qr.person_role]}</p>
                  <div className="mt-3 mb-1">
                    {/* Token QR besar untuk barcode scanner */}
                    <p className="font-mono text-2xl font-bold tracking-widest">{qr.qr_token}</p>
                  </div>
                  <p className="text-[10px] text-gray-400">Minangkabau Robot Contest</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN KECIL
// ═════════════════════════════════════════════════════

const MINI_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
}

function MiniStat({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number; color: string
}) {
  const c = MINI_COLORS[color] ?? MINI_COLORS.blue
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
        <Icon className={`size-4 ${c.text}`} />
      </div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold">{value}</p></div>
    </div>
  )
}

function QrEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-12 text-center shadow-sm print:hidden">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <QrCode className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Belum ada QR code</p>
      <p className="text-xs text-muted-foreground max-w-[300px]">
        Klik &quot;Generate QR&quot; untuk membuat QR code kokarde bagi peserta yang sudah terverifikasi pembayarannya.
      </p>
    </div>
  )
}

export function QrManagerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[240px] rounded-md" /></div>
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="size-9 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-3 w-20 rounded" /><Skeleton className="h-5 w-8 rounded" /></div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
