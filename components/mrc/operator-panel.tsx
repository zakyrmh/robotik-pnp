'use client'

/**
 * OperatorPanel — Panel kontrol operator lapangan MRC.
 *
 * Panel utama yang digunakan operator saat pertandingan berlangsung.
 * Didesain untuk kemudahan penggunaan: tombol besar, feedback jelas.
 *
 * Area:
 * 1. Selector: Event → Kategori → Pertandingan
 * 2. Display: Nama tim, skor total, babak saat ini
 * 3. Timer: Countdown dengan kontrol Start/Pause/Reset
 * 4. Skor: Input skor per babak (0-100)
 * 5. Kontrol: Swap posisi, mulai pertandingan, pilih pemenang
 */

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeftRight,
  Trophy,
  Loader2,
  Filter,
  Swords,
  Timer,
  CheckCircle2,
  Zap,
  Send,
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
  getCategoriesByEvent,
  getMatchesByCategory,
  getMatchRounds,
  updateMatchState,
  submitRoundScore,
  finishMatch,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type {
  MrcCategory,
  MrcMatchWithTeams,
  MrcMatchRound,
} from '@/lib/db/schema/mrc'
import { MRC_MATCH_STAGE_LABELS } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// HELPER: Format waktu
// ═════════════════════════════════════════════════════

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface OperatorPanelProps {
  events: MrcEventWithStats[]
  initialCategories: MrcCategory[]
}

export function OperatorPanel({ events, initialCategories }: OperatorPanelProps) {
  const [isPending, startTransition] = useTransition()

  // Selectors
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [categories, setCategories] = useState<MrcCategory[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategories[0]?.id ?? '')
  const [matches, setMatches] = useState<MrcMatchWithTeams[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState('')

  // Match state
  const [currentMatch, setCurrentMatch] = useState<MrcMatchWithTeams | null>(null)
  const [rounds, setRounds] = useState<MrcMatchRound[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Timer state (local)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerRemaining, setTimerRemaining] = useState(120)
  const [timerDuration, setTimerDuration] = useState(120)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Skor input
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [scoreNotes, setScoreNotes] = useState('')

  // ── Data loading ──

  const loadCategories = useCallback((eventId: string) => {
    startTransition(async () => {
      const result = await getCategoriesByEvent(eventId)
      const cats = result.data ?? []
      setCategories(cats)
      setSelectedCategoryId(cats[0]?.id ?? '')
    })
  }, [startTransition])

  const loadMatches = useCallback((eventId: string, categoryId: string) => {
    if (!categoryId) return
    startTransition(async () => {
      const result = await getMatchesByCategory(eventId, categoryId)
      const mList = result.data ?? []
      setMatches(mList)
      // Auto-select first upcoming/live match
      const active = mList.find((m) => m.status === 'live') ?? mList.find((m) => m.status === 'upcoming')
      if (active) {
        setSelectedMatchId(active.id)
        selectMatch(active)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTransition])

  const loadRounds = useCallback((matchId: string) => {
    startTransition(async () => {
      const result = await getMatchRounds(matchId)
      if (result.data) setRounds(result.data)
    })
  }, [startTransition])

  const selectMatch = (match: MrcMatchWithTeams) => {
    setCurrentMatch(match)
    setTimerDuration(match.timer_duration)
    setTimerRemaining(match.timer_remaining)
    setTimerRunning(match.timer_status === 'running')
    setScoreA('')
    setScoreB('')
    setScoreNotes('')
    setFeedback(null)
    loadRounds(match.id)
  }

  useEffect(() => {
    if (selectedEventId && selectedCategoryId) {
      loadMatches(selectedEventId, selectedCategoryId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Timer countdown ──

  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning, timerRemaining])

  // ── Event handlers ──

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    setCurrentMatch(null)
    setMatches([])
    setRounds([])
    loadCategories(id)
  }

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id)
    setCurrentMatch(null)
    setRounds([])
    loadMatches(selectedEventId, id)
  }

  const handleMatchChange = (id: string) => {
    setSelectedMatchId(id)
    const match = matches.find((m) => m.id === id)
    if (match) selectMatch(match)
  }

  /** Mulai pertandingan (status → live) */
  const handleStartMatch = () => {
    if (!currentMatch) return
    startTransition(async () => {
      const result = await updateMatchState(currentMatch.id, {
        status: 'live',
        timer_remaining: timerDuration,
      })
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setCurrentMatch({ ...currentMatch, status: 'live' })
        setTimerRemaining(timerDuration)
        setFeedback({ type: 'success', message: 'Pertandingan dimulai!' })
      }
    })
  }

  /** Start/pause timer */
  const handleTimerToggle = () => {
    if (!currentMatch) return
    const isStart = !timerRunning
    const now = isStart ? new Date().toISOString() : null

    setTimerRunning(isStart)
    startTransition(async () => {
      await updateMatchState(currentMatch.id, {
        timer_status: isStart ? 'running' : 'paused',
        timer_remaining: timerRemaining,
        timer_started_at: now,
      })
    })
  }

  /** Reset timer */
  const handleTimerReset = () => {
    if (!currentMatch) return
    setTimerRunning(false)
    setTimerRemaining(timerDuration)
    if (timerRef.current) clearInterval(timerRef.current)

    startTransition(async () => {
      await updateMatchState(currentMatch.id, {
        timer_status: 'stopped',
        timer_remaining: timerDuration,
        timer_started_at: null,
      })
    })
  }

  /** Atur durasi timer */
  const handleSetDuration = (seconds: number) => {
    setTimerDuration(seconds)
    setTimerRemaining(seconds)
    setTimerRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)

    if (currentMatch) {
      startTransition(async () => {
        await updateMatchState(currentMatch.id, {
          timer_duration: seconds,
          timer_remaining: seconds,
          timer_status: 'stopped',
        })
      })
    }
  }

  /** Swap posisi tim */
  const handleSwap = () => {
    if (!currentMatch) return
    const newSwapped = !currentMatch.is_swapped
    setCurrentMatch({ ...currentMatch, is_swapped: newSwapped })

    startTransition(async () => {
      await updateMatchState(currentMatch.id, { is_swapped: newSwapped })
    })
  }

  /** Submit skor babak */
  const handleSubmitScore = () => {
    if (!currentMatch) return
    const a = parseInt(scoreA)
    const b = parseInt(scoreB)
    if (isNaN(a) || isNaN(b) || a < 0 || a > 100 || b < 0 || b > 100) {
      setFeedback({ type: 'error', message: 'Skor harus angka 0-100.' })
      return
    }

    startTransition(async () => {
      const result = await submitRoundScore(
        currentMatch.id,
        currentMatch.current_round,
        a, b,
        scoreNotes || null
      )
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({ type: 'success', message: `Skor babak ${currentMatch.current_round} tersimpan: ${a} - ${b}` })
        setScoreA('')
        setScoreB('')
        setScoreNotes('')
        loadRounds(currentMatch.id)

        // Advance round
        if (currentMatch.current_round < currentMatch.total_rounds) {
          const nextRound = currentMatch.current_round + 1
          const newSwapped = nextRound % 2 === 0
          setCurrentMatch({
            ...currentMatch,
            current_round: nextRound,
            is_swapped: newSwapped,
            score_a: currentMatch.score_a + a,
            score_b: currentMatch.score_b + b,
          })
          await updateMatchState(currentMatch.id, {
            current_round: nextRound,
            is_swapped: newSwapped,
            timer_remaining: timerDuration,
            timer_status: 'stopped',
          })
          setTimerRemaining(timerDuration)
          setTimerRunning(false)
        }
      }
    })
  }

  /** Selesaikan pertandingan */
  const handleFinish = (winnerId: string) => {
    if (!currentMatch) return
    startTransition(async () => {
      const result = await finishMatch(currentMatch.id, winnerId)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({ type: 'success', message: 'Pertandingan selesai! Pemenang dicatat.' })
        setCurrentMatch({ ...currentMatch, status: 'finished', winner_id: winnerId })
        setTimerRunning(false)
        if (timerRef.current) clearInterval(timerRef.current)
        // Reload matches untuk update list
        loadMatches(selectedEventId, selectedCategoryId)
      }
    })
  }

  // ── Computed ──

  const isLive = currentMatch?.status === 'live'
  const isFinished = currentMatch?.status === 'finished'
  const isUpcoming = currentMatch?.status === 'upcoming'

  // Tim A dan B berdasarkan swap
  const displayA = currentMatch?.is_swapped
    ? { name: currentMatch.team_b_name, inst: currentMatch.team_b_institution, id: currentMatch.team_b_id }
    : { name: currentMatch?.team_a_name ?? '', inst: currentMatch?.team_a_institution ?? '', id: currentMatch?.team_a_id }
  const displayB = currentMatch?.is_swapped
    ? { name: currentMatch.team_a_name, inst: currentMatch.team_a_institution, id: currentMatch.team_a_id }
    : { name: currentMatch?.team_b_name ?? '', inst: currentMatch?.team_b_institution ?? '', id: currentMatch?.team_b_id }
  const displayScoreA = currentMatch?.is_swapped ? currentMatch?.score_b : currentMatch?.score_a
  const displayScoreB = currentMatch?.is_swapped ? currentMatch?.score_a : currentMatch?.score_b

  return (
    <div className="space-y-4">
      {/* Selector bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Event</Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="size-3" /> Kategori</Label>
          <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Pilih" /></SelectTrigger>
            <SelectContent>{categories.filter((c) => c.is_active).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Swords className="size-3" /> Pertandingan</Label>
          <Select value={selectedMatchId} onValueChange={handleMatchChange}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Pilih pertandingan" /></SelectTrigger>
            <SelectContent>
              {matches.map((m, i) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    {m.team_a_name} vs {m.team_b_name}
                    {m.status === 'live' && <span className="text-red-500">🔴</span>}
                    {m.status === 'finished' && <span className="text-emerald-500">✓</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* No match selected */}
      {!currentMatch && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-16 text-center shadow-sm">
          <Swords className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Pilih pertandingan</p>
          <p className="text-xs text-muted-foreground">Pilih pertandingan dari dropdown di atas.</p>
        </div>
      )}

      {/* Match panel */}
      {currentMatch && (
        <div className="space-y-4">
          {/* Info bar */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">{MRC_MATCH_STAGE_LABELS[currentMatch.stage]}</Badge>
            <span>Babak {currentMatch.current_round} dari {currentMatch.total_rounds}</span>
            {currentMatch.is_swapped && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/25">
                ↔ Posisi Ditukar
              </Badge>
            )}
            <Badge variant="outline" className={`text-[10px] ${
              isLive ? 'bg-red-500/15 text-red-600 border-red-500/25' :
              isFinished ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25' :
              'bg-zinc-500/15'
            }`}>
              {isLive ? '🔴 LIVE' : isFinished ? '✓ Selesai' : 'Akan Datang'}
            </Badge>
          </div>

          {/* ═══ SCOREBOARD BESAR ═══ */}
          <div className="rounded-2xl border bg-linear-to-b from-card to-accent/20 shadow-md overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_1fr]">
              {/* Tim kiri */}
              <div className="p-6 text-center">
                <p className="text-lg font-bold truncate">{displayA.name}</p>
                <p className="text-xs text-muted-foreground truncate">{displayA.inst}</p>
                <p className="text-5xl font-black mt-3 tabular-nums">{displayScoreA ?? 0}</p>
              </div>

              {/* VS + Timer */}
              <div className="flex flex-col items-center justify-center px-4 border-x bg-accent/10">
                <p className="text-sm font-bold text-muted-foreground">VS</p>
                <div className={`mt-2 text-3xl font-black tabular-nums ${
                  timerRemaining <= 30 && timerRunning ? 'text-red-500 animate-pulse' : ''
                }`}>
                  {formatTime(timerRemaining)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Babak {currentMatch.current_round}</p>
              </div>

              {/* Tim kanan */}
              <div className="p-6 text-center">
                <p className="text-lg font-bold truncate">{displayB.name}</p>
                <p className="text-xs text-muted-foreground truncate">{displayB.inst}</p>
                <p className="text-5xl font-black mt-3 tabular-nums">{displayScoreB ?? 0}</p>
              </div>
            </div>
          </div>

          {/* ═══ KONTROL TIMER ═══ */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-orange-500" />
              <Label className="text-sm font-semibold">Timer</Label>
            </div>

            {/* Preset durasi */}
            <div className="flex flex-wrap gap-1.5">
              {[60, 120, 180, 300, 600].map((sec) => (
                <Button
                  key={sec}
                  variant={timerDuration === sec ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs cursor-pointer"
                  onClick={() => handleSetDuration(sec)}
                  disabled={timerRunning}
                >
                  {sec < 60 ? `${sec}d` : `${sec / 60}m`}
                </Button>
              ))}
              {/* Input kustom */}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  className="w-16 h-8 text-xs"
                  placeholder="Min"
                  disabled={timerRunning}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value)
                    if (val > 0 && val <= 30) handleSetDuration(val * 60)
                  }}
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>

            {/* Tombol kontrol */}
            <div className="flex gap-2">
              <Button
                size="lg"
                className={`flex-1 cursor-pointer ${timerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                onClick={handleTimerToggle}
                disabled={!isLive || timerRemaining === 0}
              >
                {timerRunning ? <Pause className="size-5" /> : <Play className="size-5" />}
                {timerRunning ? 'Pause' : 'Start'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="cursor-pointer"
                onClick={handleTimerReset}
                disabled={timerRunning}
              >
                <RotateCcw className="size-5" />
                Reset
              </Button>
            </div>
          </div>

          {/* ═══ INPUT SKOR ═══ */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              <Label className="text-sm font-semibold">Skor Babak {currentMatch.current_round}</Label>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs text-center block">{displayA.name}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="text-center text-lg font-bold h-12"
                  disabled={isFinished}
                />
              </div>
              <span className="text-sm text-muted-foreground pb-3">—</span>
              <div className="space-y-1.5">
                <Label className="text-xs text-center block">{displayB.name}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="text-center text-lg font-bold h-12"
                  disabled={isFinished}
                />
              </div>
            </div>

            <Input
              placeholder="Catatan juri (opsional)"
              value={scoreNotes}
              onChange={(e) => setScoreNotes(e.target.value)}
              disabled={isFinished}
              className="text-xs"
            />

            <Button
              onClick={handleSubmitScore}
              disabled={isPending || isFinished || !scoreA || !scoreB}
              className="w-full cursor-pointer"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Simpan Skor Babak {currentMatch.current_round}
            </Button>

            {/* Riwayat skor babak */}
            {rounds.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium">Skor per babak:</p>
                {rounds.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs bg-accent/30 rounded-md px-3 py-1.5">
                    <span>Babak {r.round_number}</span>
                    <span className="font-mono font-bold">{r.score_a} - {r.score_b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ AKSI PERTANDINGAN ═══ */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-blue-500" />
              <Label className="text-sm font-semibold">Aksi Pertandingan</Label>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Mulai pertandingan */}
              {isUpcoming && (
                <Button onClick={handleStartMatch} disabled={isPending} className="cursor-pointer bg-emerald-600 hover:bg-emerald-700">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                  Mulai Pertandingan
                </Button>
              )}

              {/* Swap */}
              {isLive && (
                <Button variant="outline" onClick={handleSwap} disabled={isPending} className="cursor-pointer">
                  <ArrowLeftRight className="size-4" />
                  Tukar Posisi
                </Button>
              )}

              {/* Selesaikan — pilih pemenang */}
              {isLive && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="cursor-pointer border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                      <Trophy className="size-4" />
                      Selesaikan & Pilih Pemenang
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <Trophy className="size-5 text-amber-500" />
                        Pilih Pemenang
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Pertandingan akan ditandai selesai. Pemenang akan otomatis maju ke bracket selanjutnya (jika ada).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2 py-2">
                      {displayA.id && (
                        <Button
                          variant="outline"
                          className="justify-start text-left h-auto py-3 cursor-pointer"
                          onClick={() => { handleFinish(displayA.id!); }}
                        >
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <div>
                            <p className="font-semibold">{displayA.name}</p>
                            <p className="text-xs text-muted-foreground">{displayA.inst}</p>
                          </div>
                        </Button>
                      )}
                      {displayB.id && (
                        <Button
                          variant="outline"
                          className="justify-start text-left h-auto py-3 cursor-pointer"
                          onClick={() => { handleFinish(displayB.id!); }}
                        >
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <div>
                            <p className="font-semibold">{displayB.name}</p>
                            <p className="text-xs text-muted-foreground">{displayB.inst}</p>
                          </div>
                        </Button>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Status selesai */}
            {isFinished && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">Pertandingan selesai</p>
                  <p className="text-xs text-muted-foreground">
                    Pemenang: {currentMatch.winner_id === currentMatch.team_a_id ? currentMatch.team_a_name : currentMatch.team_b_name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
              feedback.type === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            }`}>{feedback.message}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// SKELETON
// ═════════════════════════════════════════════════════

export function OperatorSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {[200, 180, 260].map((w) => (
          <div key={w} className="space-y-1.5">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className={`h-9 rounded-md`} style={{ width: w }} />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card shadow-md p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-5 w-24 mx-auto rounded" />
            <Skeleton className="h-12 w-16 mx-auto rounded" />
          </div>
          <div className="flex flex-col items-center justify-center space-y-2">
            <Skeleton className="h-4 w-8 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-5 w-24 mx-auto rounded" />
            <Skeleton className="h-12 w-16 mx-auto rounded" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <Skeleton className="h-4 w-20 rounded" />
        <div className="flex gap-1.5">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-12 rounded-md" />)}</div>
        <div className="flex gap-2"><Skeleton className="h-10 flex-1 rounded-md" /><Skeleton className="h-10 w-24 rounded-md" /></div>
      </div>
    </div>
  )
}
