'use client'

/**
 * PiketScheduleManager — Kelola periode & jadwal piket anggota.
 *
 * Fitur:
 * - Buat periode baru (nama, tanggal, nominal denda)
 * - Generate jadwal piket otomatis (distribusi minggu merata)
 * - Tabel jadwal per minggu dengan opsi ubah minggu
 * - Update nominal denda
 */

import { useState, useTransition } from 'react'
import {
  Plus,
  Loader2,
  Shuffle,
  Users,
  CalendarDays,
  Edit3,
  CheckCircle2,
  Banknote,
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
  createPiketPeriod,
  generatePiketSchedule,
  getPiketAssignments,
  updateAssignmentWeek,
  updateFineAmount,
} from '@/app/actions/kestari.action'
import type { PiketPeriod, PiketAssignmentWithUser } from '@/lib/db/schema/kestari'
import { WEEK_LABELS } from '@/lib/db/schema/kestari'

// ═══════════════════════════════════════════════

interface Props {
  periods: PiketPeriod[]
  activePeriod: PiketPeriod | null
  initialAssignments: PiketAssignmentWithUser[]
}

export function PiketScheduleManager({ periods: initPeriods, activePeriod: initActive, initialAssignments }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activePeriod, setActivePeriod] = useState(initActive)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Form create period
  const [periodName, setPeriodName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [fineAmount, setFineAmount] = useState('10000')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Edit fine
  const [editFine, setEditFine] = useState(false)
  const [editFineValue, setEditFineValue] = useState('')

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleCreatePeriod = () => {
    if (!periodName || !startDate || !endDate) {
      showFeedback('error', 'Lengkapi semua field.')
      return
    }
    startTransition(async () => {
      const result = await createPiketPeriod(
        periodName,
        startDate,
        endDate,
        parseInt(fineAmount) || 10000,
      )
      if (result.error) {
        showFeedback('error', result.error)
      } else if (result.data) {
        setActivePeriod(result.data)
        setAssignments([])
        setShowCreateForm(false)
        showFeedback('success', 'Periode baru berhasil dibuat!')
      }
    })
  }

  const handleGenerate = () => {
    if (!activePeriod) return
    startTransition(async () => {
      const result = await generatePiketSchedule(activePeriod.id)
      if (result.error) {
        showFeedback('error', result.error)
      } else {
        showFeedback('success', `Jadwal piket berhasil digenerate untuk ${result.data?.total} anggota!`)
        // Reload assignments
        const aRes = await getPiketAssignments(activePeriod.id)
        setAssignments(aRes.data ?? [])
      }
    })
  }

  const handleWeekChange = (assignmentId: string, week: string) => {
    const w = parseInt(week)
    startTransition(async () => {
      const result = await updateAssignmentWeek(assignmentId, w)
      if (result.error) {
        showFeedback('error', result.error)
      } else {
        setAssignments((prev) =>
          prev.map((a) => a.id === assignmentId ? { ...a, assigned_week: w } : a)
        )
      }
    })
  }

  const handleUpdateFine = () => {
    if (!activePeriod) return
    const val = parseInt(editFineValue)
    if (isNaN(val) || val < 0) {
      showFeedback('error', 'Nominal denda tidak valid.')
      return
    }
    startTransition(async () => {
      const result = await updateFineAmount(activePeriod.id, val)
      if (result.error) {
        showFeedback('error', result.error)
      } else if (result.data) {
        setActivePeriod(result.data)
        setEditFine(false)
        showFeedback('success', 'Nominal denda berhasil diperbarui!')
      }
    })
  }

  // Grup assignment per minggu
  const byWeek = new Map<number, PiketAssignmentWithUser[]>()
  for (const a of assignments) {
    const arr = byWeek.get(a.assigned_week) ?? []
    arr.push(a)
    byWeek.set(a.assigned_week, arr)
  }

  return (
    <div className="space-y-4">
      {/* Periode aktif */}
      {activePeriod ? (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold">{activePeriod.name}</p>
              <p className="text-xs text-muted-foreground">
                {activePeriod.start_date} — {activePeriod.end_date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {editFine ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={editFineValue}
                    onChange={(e) => setEditFineValue(e.target.value)}
                    className="w-28 h-8 text-xs"
                  />
                  <Button size="sm" onClick={handleUpdateFine} disabled={isPending} className="cursor-pointer">
                    <CheckCircle2 className="size-3" /> Simpan
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditFine(false)} className="cursor-pointer">Batal</Button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => { setEditFine(true); setEditFineValue(String(activePeriod.fine_amount)) }}
                >
                  <Banknote className="size-3 mr-1" />
                  Denda: Rp {activePeriod.fine_amount.toLocaleString('id-ID')}
                  <Edit3 className="size-2.5 ml-1 opacity-50" />
                </Badge>
              )}
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/25">
                Aktif
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <CalendarDays className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Belum ada periode aktif</p>
          <p className="text-xs text-muted-foreground mb-3">Buat periode baru untuk mulai menjadwalkan piket.</p>
        </div>
      )}

      {/* Tombol aksi */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="cursor-pointer"
        >
          <Plus className="size-4" />
          Buat Periode Baru
        </Button>

        {activePeriod && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="cursor-pointer bg-indigo-600 hover:bg-indigo-700">
                <Shuffle className="size-4" />
                Generate Jadwal Piket
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate Jadwal Piket?</AlertDialogTitle>
                <AlertDialogDescription>
                  Jadwal piket lama akan dihapus dan diganti dengan jadwal baru yang diacak.
                  Semua anggota aktif (role: anggota & pengurus) akan mendapat jadwal 1x/bulan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <Button onClick={handleGenerate} disabled={isPending} className="cursor-pointer">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Shuffle className="size-4" />}
                  Generate
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Form Buat Periode */}
      {showCreateForm && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <Label className="text-sm font-semibold">Buat Periode Baru</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Periode</Label>
              <Input value={periodName} onChange={(e) => setPeriodName(e.target.value)} placeholder="Periode 2025/2026" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Mulai</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Akhir</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nominal Denda (Rp)</Label>
              <Input type="number" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} placeholder="10000" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreatePeriod} disabled={isPending} className="cursor-pointer">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Buat Periode
            </Button>
            <Button variant="ghost" onClick={() => setShowCreateForm(false)} className="cursor-pointer">Batal</Button>
          </div>
        </div>
      )}

      {/* Tabel Jadwal per Minggu */}
      {assignments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-indigo-500" />
            <Label className="text-sm font-semibold">Jadwal Piket ({assignments.length} anggota)</Label>
          </div>

          {[1, 2, 3, 4, 5].map((week) => {
            const weekAssignments = byWeek.get(week) ?? []
            if (weekAssignments.length === 0) return null
            return (
              <div key={week} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-accent/30 border-b flex items-center justify-between">
                  <p className="text-xs font-semibold">{WEEK_LABELS[week]}</p>
                  <Badge variant="outline" className="text-[10px]">{weekAssignments.length} orang</Badge>
                </div>
                <div className="divide-y">
                  {weekAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold shrink-0">
                          {(a.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{a.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                        </div>
                      </div>
                      <Select
                        value={String(a.assigned_week)}
                        onValueChange={(v) => handleWeekChange(a.id, v)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((w) => (
                            <SelectItem key={w} value={String(w)}>{WEEK_LABELS[w]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
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

export function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-xl" />
      <div className="flex gap-2"><Skeleton className="h-9 w-40 rounded-md" /><Skeleton className="h-9 w-44 rounded-md" /></div>
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
    </div>
  )
}
