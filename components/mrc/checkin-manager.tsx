'use client'

/**
 * CheckinManager — Komponen client untuk pendaftaran ulang
 * (check-in) peserta MRC di hari-H.
 *
 * Fitur:
 * - Input scan QR token (dari scanner atau manual)
 * - Statistik realtime: total QR, checked-in, di dalam gedung
 * - Daftar peserta dengan status check-in
 * - Hasil scan langsung (berhasil/gagal/sudah check-in)
 */

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Building2,
  ScanLine,
  DoorOpen,
  UserCheck,
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
  getCheckinStats,
  getQrCodesForEvent,
  scanQrToken,
  type CheckinStats,
  type ScanResult,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type { MrcQrCodeWithTeam } from '@/lib/db/schema/mrc'
import { MRC_MEMBER_ROLE_LABELS } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

export function CheckinManager({ events }: { events: MrcEventWithStats[] }) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [qrCodes, setQrCodes] = useState<MrcQrCodeWithTeam[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /** Muat data */
  const loadData = useCallback(
    (eventId: string) => {
      startTransition(async () => {
        const [statsRes, qrRes] = await Promise.all([
          getCheckinStats(eventId),
          getQrCodesForEvent(eventId),
        ])
        if (statsRes.data) setStats(statsRes.data)
        if (qrRes.data) setQrCodes(qrRes.data)
      })
    },
    [startTransition]
  )

  useEffect(() => {
    if (selectedEventId) loadData(selectedEventId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Handle scan */
  const handleScan = () => {
    if (!tokenInput.trim()) return
    setScanResult(null)
    setScanError(null)

    startTransition(async () => {
      const result = await scanQrToken(tokenInput.trim(), 'checkin')
      if (result.error) {
        setScanError(result.error)
      } else if (result.data) {
        setScanResult(result.data)
      }
      setTokenInput('')
      inputRef.current?.focus()
      loadData(selectedEventId)
    })
  }

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    setScanResult(null)
    setScanError(null)
    loadData(id)
  }

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

      {/* Statistik */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat icon={Users} label="Total Kokarde" value={stats?.totalQr ?? 0} color="blue" />
        <MiniStat icon={UserCheck} label="Sudah Check-in" value={stats?.checkedIn ?? 0} color="emerald" />
        <MiniStat icon={DoorOpen} label="Di Dalam Gedung" value={stats?.insideVenue ?? 0} color="violet" />
      </div>

      {/* Scanner input */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ScanLine className="size-4 text-emerald-500" />
          <Label className="text-sm font-semibold">Scan QR Check-in</Label>
        </div>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Scan atau ketik token QR..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="font-mono"
            autoFocus
          />
          <Button onClick={handleScan} disabled={isPending || !tokenInput.trim()} className="cursor-pointer">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
            Check-in
          </Button>
        </div>

        {/* Hasil scan */}
        {scanResult && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-top-1">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  {scanResult.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tim: {scanResult.qr.team_name} · {scanResult.qr.institution} · {scanResult.qr.category_name}
                </p>
              </div>
            </div>
          </div>
        )}
        {scanError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 shrink-0 text-destructive" />
              <p className="text-destructive">{scanError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Daftar peserta */}
      {qrCodes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2">Daftar Peserta</h2>
          <div className="rounded-xl border bg-card shadow-sm divide-y max-h-[400px] overflow-y-auto">
            {qrCodes.map((qr) => (
              <div key={qr.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <div className={`size-2 rounded-full shrink-0 ${qr.is_checked_in ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{qr.person_name}</p>
                  <p className="text-muted-foreground">{qr.team_name} · {MRC_MEMBER_ROLE_LABELS[qr.person_role]}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {qr.is_checked_in && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400">
                      ✓ Check-in
                    </Badge>
                  )}
                  {qr.is_inside && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400">
                      <Building2 className="size-2.5 mr-0.5" /> Inside
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
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

export function CheckinSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[240px] rounded-md" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="size-9 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-3 w-20 rounded" /><Skeleton className="h-5 w-8 rounded" /></div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex gap-2"><Skeleton className="h-9 flex-1 rounded-md" /><Skeleton className="h-9 w-24 rounded-md" /></div>
      </div>
    </div>
  )
}
