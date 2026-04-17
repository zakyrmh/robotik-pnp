'use client'

/**
 * AbsensiManager — Scan QR absensi + kelola kehadiran.
 *
 * Fitur:
 * - Pilih kegiatan aktif (ongoing)
 * - Input scan QR token (barcode scanner / manual)
 * - Realtime: hasil scan langsung tampil, pesan auto-dismiss
 * - Tabel kehadiran: hadir, telat, sanksi
 * - Input sanksi untuk yang telat (fisik / poin)
 * - Statistik kehadiran per kegiatan
 */

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import {
  ScanLine,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Filter,
  Loader2,
  Zap,
  Shield,
  Dumbbell,
  Timer,
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
  scanAttendanceToken,
  getEventAttendances,
  getEventStats,
  giveSanction,
} from '@/app/actions/komdis.action'
import type { KomdisEvent, KomdisAttendanceWithUser, KomdisEventStats, KomdisAttendanceStatus } from '@/lib/db/schema/komdis'
import { KOMDIS_ATTENDANCE_STATUS_LABELS, KOMDIS_SANCTION_TYPE_LABELS } from '@/lib/db/schema/komdis'

// ═══════════════════════════════════════════════

const ATT_STATUS_COLORS: Record<KomdisAttendanceStatus, string> = {
  present: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  late: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  absent: 'bg-red-500/15 text-red-600 border-red-500/25',
}

interface Props {
  events: KomdisEvent[]
}

interface ScanResult {
  type: 'success' | 'error' | 'late'
  msg: string
  name?: string
  lateMinutes?: number
  attendanceId?: string
  userId?: string
}

export function AbsensiManager({ events }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(
    events.find((e) => e.status === 'ongoing')?.id ?? events[0]?.id ?? ''
  )
  const [attendances, setAttendances] = useState<KomdisAttendanceWithUser[]>([])
  const [stats, setStats] = useState<KomdisEventStats | null>(null)

  // Scanner
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sanksi dialog
  const [sanctionTarget, setSanctionTarget] = useState<KomdisAttendanceWithUser | null>(null)
  const [sanctionType, setSanctionType] = useState<'physical' | 'points'>('physical')
  const [sanctionPoints, setSanctionPoints] = useState('1')
  const [sanctionNotes, setSanctionNotes] = useState('')

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const isOngoing = selectedEvent?.status === 'ongoing'

  const loadData = useCallback((eventId: string) => {
    startTransition(async () => {
      const [attRes, statRes] = await Promise.all([
        getEventAttendances(eventId),
        getEventStats(eventId),
      ])
      setAttendances(attRes.data ?? [])
      setStats(statRes.data ?? null)
    })
  }, [startTransition])

  useEffect(() => {
    if (selectedEventId) loadData(selectedEventId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

  // Auto-focus scanner saat ongoing
  useEffect(() => {
    if (isOngoing) inputRef.current?.focus()
  }, [isOngoing, selectedEventId])

  const handleScan = () => {
    const token = scanInput.trim()
    if (!token || !selectedEventId) return

    // Clear dismiss timer
    if (dismissRef.current) clearTimeout(dismissRef.current)

    startTransition(async () => {
      const result = await scanAttendanceToken({ token })
      setScanInput('')
      inputRef.current?.focus()

      if (result.error) {
        setScanResult({ type: 'error', msg: result.error })
      } else if (result.data) {
        const { userId, isLate, lateMinutes } = result.data
        const att = attendances.find((a) => a.user_id === userId)
        const fullName = att?.full_name ?? 'Anggota'
        if (isLate) {
          setScanResult({
            type: 'late',
            msg: `${fullName} — TERLAMBAT ${lateMinutes} menit`,
            name: fullName,
            lateMinutes,
            attendanceId: att?.id,
            userId,
          })
        } else {
          setScanResult({
            type: 'success',
            msg: `${fullName} — Hadir ✓`,
            name: fullName,
          })
        }
        loadData(selectedEventId)
      }

      // Auto-dismiss setelah 4 detik (kecuali late yang butuh aksi)
      dismissRef.current = setTimeout(() => {
        setScanResult((prev) => prev?.type === 'late' ? prev : null)
      }, 4000)
    })
  }

  const handleScanKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleScan()
    }
  }

  const handleGiveSanction = () => {
    if (!sanctionTarget || !selectedEventId) return
    startTransition(async () => {
      const result = await giveSanction({
        attendanceId: sanctionTarget.id,
        sanctionType,
        points: sanctionType === 'points' ? (parseInt(sanctionPoints) || 1) : 0,
        notes: sanctionNotes || undefined,
      })
      if (result.error) {
        setScanResult({ type: 'error', msg: result.error })
      } else {
        setScanResult({ type: 'success', msg: `Sanksi diberikan ke ${sanctionTarget.full_name}` })
        setSanctionTarget(null)
        setSanctionNotes('')
        loadData(selectedEventId)
      }
      // Auto-dismiss
      dismissRef.current = setTimeout(() => setScanResult(null), 3000)
    })
  }

  // Juga beri sanksi dari scan result late
  const handleQuickSanction = (type: 'physical' | 'points') => {
    if (!scanResult?.attendanceId || !scanResult.userId) return
    startTransition(async () => {
      const pts = type === 'points' ? (selectedEvent?.points_per_late ?? 1) : 0
      const result = await giveSanction({
        attendanceId: scanResult.attendanceId!,
        sanctionType: type,
        points: pts,
        notes: type === 'physical' ? 'Sanksi fisik langsung' : `Poin keterlambatan: ${pts}`,
      })
      if (result.error) {
        setScanResult({ type: 'error', msg: result.error })
      } else {
        setScanResult({ type: 'success', msg: `Sanksi ${KOMDIS_SANCTION_TYPE_LABELS[type]} diberikan.` })
        loadData(selectedEventId)
      }
      dismissRef.current = setTimeout(() => setScanResult(null), 3000)
    })
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <ScanLine className="size-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Belum ada kegiatan</p>
        <p className="text-xs text-muted-foreground">Buat kegiatan terlebih dahulu di menu &quot;Buat Kegiatan&quot;.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pilih kegiatan */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Kegiatan</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} — {e.event_date}
                  {e.status === 'ongoing' ? ' 🟢' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedEvent && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" /> {selectedEvent.start_time}
            <Timer className="size-3 ml-2" /> Toleransi: {selectedEvent.late_tolerance} mnt
          </div>
        )}
      </div>

      {/* Statistik */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Hadir', value: stats.totalPresent, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10' },
            { label: 'Terlambat', value: stats.totalLate, icon: Clock, color: 'text-amber-600 bg-amber-500/10' },
            { label: 'Tidak Hadir', value: stats.totalAbsent, icon: AlertTriangle, color: 'text-red-600 bg-red-500/10' },
            { label: 'Sanksi Fisik', value: stats.totalSanctionPhysical, icon: Dumbbell, color: 'text-orange-600 bg-orange-500/10' },
            { label: 'Total Poin', value: stats.totalSanctionPoints, icon: Zap, color: 'text-purple-600 bg-purple-500/10' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-lg border bg-card p-3 shadow-sm">
                <div className={`flex size-7 items-center justify-center rounded-md ${s.color} mb-1`}>
                  <Icon className="size-3.5" />
                </div>
                <p className="text-xl font-bold tabular-nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Scanner */}
      {isOngoing && (
        <div className="rounded-xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ScanLine className="size-5 text-cyan-600" />
            <Label className="text-sm font-semibold">Scanner QR Absensi</Label>
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25 text-[10px]">
              🟢 Aktif
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScanKeydown}
              placeholder="Scan atau ketik QR token..."
              className="font-mono text-sm flex-1"
              autoFocus
            />
            <Button onClick={handleScan} disabled={isPending || !scanInput.trim()} className="cursor-pointer">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
              Scan
            </Button>
          </div>

          {/* Hasil scan */}
          {scanResult && (
            <div className={`rounded-lg border px-4 py-3 animate-in fade-in-0 slide-in-from-top-2 ${
              scanResult.type === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : scanResult.type === 'late'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            }`}>
              <p className="text-sm font-medium">{scanResult.msg}</p>

              {/* Aksi cepat untuk yang telat */}
              {scanResult.type === 'late' && scanResult.attendanceId && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs cursor-pointer border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                    onClick={() => handleQuickSanction('physical')}
                    disabled={isPending}
                  >
                    <Dumbbell className="size-3" /> Sanksi Fisik
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs cursor-pointer border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                    onClick={() => handleQuickSanction('points')}
                    disabled={isPending}
                  >
                    <Zap className="size-3" /> +{selectedEvent?.points_per_late ?? 1} Poin
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs cursor-pointer"
                    onClick={() => setScanResult(null)}
                  >
                    Lewati
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabel Kehadiran */}
      {attendances.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-cyan-500" />
              <p className="text-xs font-semibold">Daftar Kehadiran ({attendances.length})</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="px-4 py-2 text-left font-medium text-xs">Anggota</th>
                <th className="px-3 py-2 text-center font-medium text-xs">Status</th>
                <th className="px-3 py-2 text-center font-medium text-xs">Jam Scan</th>
                <th className="px-3 py-2 text-center font-medium text-xs">Telat</th>
                <th className="px-3 py-2 text-center font-medium text-xs">Sanksi</th>
                <th className="px-3 py-2 text-center font-medium text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att) => (
                <tr key={att.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                        {(att.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{att.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{att.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className={`text-[10px] ${ATT_STATUS_COLORS[att.status]}`}>
                      {KOMDIS_ATTENDANCE_STATUS_LABELS[att.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-muted-foreground font-mono">
                    {new Date(att.scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {att.is_late ? (
                      <span className="text-amber-600 font-medium">{att.late_minutes} mnt</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {att.sanction ? (
                      <Badge variant="outline" className={`text-[10px] ${
                        att.sanction.sanction_type === 'physical'
                          ? 'bg-orange-500/15 text-orange-600 border-orange-500/25'
                          : 'bg-purple-500/15 text-purple-600 border-purple-500/25'
                      }`}>
                        {att.sanction.sanction_type === 'physical'
                          ? '🏋️ Fisik'
                          : `⚡ ${att.sanction.points} poin`
                        }
                      </Badge>
                    ) : att.is_late ? (
                      <span className="text-muted-foreground italic">Belum</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {att.is_late && !att.sanction && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-6 px-2 cursor-pointer"
                        onClick={() => {
                          setSanctionTarget(att)
                          setSanctionType('physical')
                          setSanctionPoints(String(selectedEvent?.points_per_late ?? 1))
                        }}
                      >
                        <Shield className="size-3" /> Sanksi
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sanksi dialog inline */}
      {sanctionTarget && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-red-500" />
            <Label className="text-sm font-semibold">Berikan Sanksi — {sanctionTarget.full_name}</Label>
            <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/25">
              Telat {sanctionTarget.late_minutes} menit
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipe Sanksi</Label>
              <Select value={sanctionType} onValueChange={(v) => setSanctionType(v as 'physical' | 'points')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">🏋️ Sanksi Fisik (0 poin)</SelectItem>
                  <SelectItem value="points">⚡ Penambahan Poin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sanctionType === 'points' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Jumlah Poin</Label>
                <Input type="number" min={1} value={sanctionPoints} onChange={(e) => setSanctionPoints(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Catatan</Label>
              <Input value={sanctionNotes} onChange={(e) => setSanctionNotes(e.target.value)} placeholder="push-up 20x..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGiveSanction} disabled={isPending} className="cursor-pointer">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Berikan Sanksi
            </Button>
            <Button variant="ghost" onClick={() => setSanctionTarget(null)} className="cursor-pointer">Batal</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AbsensiSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-[300px] rounded-md" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
