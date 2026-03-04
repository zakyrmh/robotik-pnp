'use client'

/**
 * ScanQrManager — Komponen client untuk scan QR multi-mode.
 *
 * Mode yang didukung:
 * - checkin: Pendaftaran ulang hari-H
 * - entry: Masuk gedung (harus sudah check-in)
 * - exit: Keluar gedung
 * - match_verify: Verifikasi anggota tim saat pertandingan (anti-joki)
 *
 * Fitur:
 * - Toggle mode scan
 * - Input QR token (barcode scanner / manual)
 * - Hasil scan langsung: identitas, tim, role, status
 * - Riwayat scan terakhir (session-based)
 * - Statistik check-in realtime
 */

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
  DoorOpen,
  DoorClosed,
  UserCheck,
  Swords,
  Users,
  Clock,
  Building2,
  Filter,
  Trash2,
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
  scanQrToken,
  type CheckinStats,
  type ScanResult,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type { MrcScanType } from '@/lib/db/schema/mrc'
import { MRC_SCAN_TYPE_LABELS, MRC_MEMBER_ROLE_LABELS } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KONSTANTA
// ═════════════════════════════════════════════════════

/** Mode scan tersedia */
const SCAN_MODES = [
  { value: 'checkin' as MrcScanType, label: 'Check-in', icon: UserCheck, color: 'emerald' },
  { value: 'entry' as MrcScanType, label: 'Masuk Gedung', icon: DoorOpen, color: 'blue' },
  { value: 'exit' as MrcScanType, label: 'Keluar Gedung', icon: DoorClosed, color: 'amber' },
  { value: 'match_verify' as MrcScanType, label: 'Verifikasi Tanding', icon: Swords, color: 'red' },
] as const

const MODE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  red: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
}

/** Item riwayat scan */
interface ScanHistoryItem {
  id: string
  result: ScanResult | null
  error: string | null
  mode: MrcScanType
  token: string
  timestamp: Date
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

export function ScanQrManager({ events }: { events: MrcEventWithStats[] }) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [scanMode, setScanMode] = useState<MrcScanType>('match_verify')
  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const loadStats = useCallback(
    (eventId: string) => {
      startTransition(async () => {
        const res = await getCheckinStats(eventId)
        if (res.data) setStats(res.data)
      })
    },
    [startTransition]
  )

  useEffect(() => {
    if (selectedEventId) loadStats(selectedEventId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Eksekusi scan */
  const handleScan = () => {
    const token = tokenInput.trim()
    if (!token) return

    setLastResult(null)
    setLastError(null)

    startTransition(async () => {
      const result = await scanQrToken(token, scanMode)

      const historyItem: ScanHistoryItem = {
        id: crypto.randomUUID(),
        result: result.data,
        error: result.error,
        mode: scanMode,
        token,
        timestamp: new Date(),
      }
      setHistory((prev) => [historyItem, ...prev].slice(0, 20))

      if (result.error) {
        setLastError(result.error)
      } else if (result.data) {
        setLastResult(result.data)
      }

      setTokenInput('')
      inputRef.current?.focus()
      loadStats(selectedEventId)
    })
  }

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    setLastResult(null)
    setLastError(null)
    loadStats(id)
  }

  const activeMode = SCAN_MODES.find((m) => m.value === scanMode)!
  const activeModeColor = MODE_COLORS[activeMode.color]

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
        <MiniStat icon={Building2} label="Di Dalam Gedung" value={stats?.insideVenue ?? 0} color="violet" />
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SCAN_MODES.map((mode) => {
          const mColor = MODE_COLORS[mode.color]
          const isActive = scanMode === mode.value
          return (
            <button
              key={mode.value}
              type="button"
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                isActive
                  ? `${mColor.bg} ${mColor.border} ring-1 ring-offset-1 ${mColor.border.replace('border-', 'ring-')}`
                  : 'bg-card hover:bg-accent/50'
              }`}
              onClick={() => setScanMode(mode.value)}
            >
              <mode.icon className={`size-4 ${isActive ? mColor.text : 'text-muted-foreground'}`} />
              <span className={`text-xs font-medium ${isActive ? mColor.text : ''}`}>{mode.label}</span>
            </button>
          )
        })}
      </div>

      {/* Scanner input */}
      <div className={`rounded-xl border p-4 shadow-sm space-y-3 ${activeModeColor.bg} ${activeModeColor.border}`}>
        <div className="flex items-center gap-2">
          <ScanLine className={`size-4 ${activeModeColor.text}`} />
          <Label className={`text-sm font-semibold ${activeModeColor.text}`}>
            Mode: {MRC_SCAN_TYPE_LABELS[scanMode]}
          </Label>
        </div>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Scan atau ketik token QR..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="font-mono bg-background"
            autoFocus
          />
          <Button onClick={handleScan} disabled={isPending || !tokenInput.trim()} className="cursor-pointer">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
            Scan
          </Button>
        </div>

        {/* Hasil scan terakhir */}
        {lastResult && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-top-1">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">{lastResult.message}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                  <span>Tim: {lastResult.qr.team_name}</span>
                  <span>{lastResult.qr.institution}</span>
                  <span>{lastResult.qr.category_name}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {MRC_MEMBER_ROLE_LABELS[lastResult.qr.person_role]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
        {lastError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 shrink-0 text-destructive" />
              <p className="text-destructive">{lastError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Riwayat scan (session saja) */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="size-3.5" /> Riwayat Scan
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground cursor-pointer"
              onClick={() => setHistory([])}
            >
              <Trash2 className="size-3" /> Bersihkan
            </Button>
          </div>
          <div className="rounded-xl border bg-card shadow-sm divide-y max-h-[300px] overflow-y-auto">
            {history.map((item) => {
              const mode = SCAN_MODES.find((m) => m.value === item.mode)
              const mColor = mode ? MODE_COLORS[mode.color] : MODE_COLORS.blue
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <div className={`size-2 rounded-full shrink-0 ${item.error ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {item.result?.message ?? item.error}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${mColor.bg} ${mColor.text}`}>
                        {MRC_SCAN_TYPE_LABELS[item.mode]}
                      </Badge>
                      <span className="font-mono">{item.token}</span>
                      <span>{item.timestamp.toLocaleTimeString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN KECIL
// ═════════════════════════════════════════════════════

const STAT_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
}

function MiniStat({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number; color: string
}) {
  const c = STAT_COLORS[color] ?? STAT_COLORS.blue
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
        <Icon className={`size-4 ${c.text}`} />
      </div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold">{value}</p></div>
    </div>
  )
}

export function ScanQrSkeleton() {
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <Skeleton className="h-4 w-36 rounded" />
        <div className="flex gap-2"><Skeleton className="h-9 flex-1 rounded-md" /><Skeleton className="h-9 w-20 rounded-md" /></div>
      </div>
    </div>
  )
}
