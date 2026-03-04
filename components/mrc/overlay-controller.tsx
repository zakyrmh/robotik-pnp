'use client'

/**
 * OverlayController — Kontrol scene overlay OBS dari dashboard.
 *
 * Fitur:
 * - Pilih active scene (none, match, scoreboard, bracket, standing, coming_up, break)
 * - Kontrol break: pesan, mode timer (none/countdown/target), durasi
 * - Kontrol coming up: pilih match berikutnya, pesan, timer
 * - Semua update dikirim ke mrc_live_state → overlay Realtime subscribe
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  Monitor,
  Swords,
  Trophy,
  Users,
  Coffee,
  CalendarClock,
  Ban,
  Filter,
  Loader2,
  Radio,
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
  getCategoriesByEvent,
  getLiveState,
  updateLiveState,
  getMatchesByCategory,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type { MrcCategory, MrcLiveState, MrcOverlayScene, MrcMatchWithTeams } from '@/lib/db/schema/mrc'
import { MRC_OVERLAY_SCENE_LABELS, MRC_OVERLAY_SCENES, MRC_TIMER_MODE_LABELS } from '@/lib/db/schema/mrc'

// ═══════════════════════════════════════════════
// SCENE ICONS
// ═══════════════════════════════════════════════

const SCENE_ICONS: Record<MrcOverlayScene, React.ComponentType<{ className?: string }>> = {
  none: Ban,
  match: Swords,
  scoreboard: Monitor,
  bracket: Trophy,
  standing: Users,
  coming_up: CalendarClock,
  break: Coffee,
}

const SCENE_COLORS: Record<MrcOverlayScene, string> = {
  none: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25',
  match: 'bg-red-500/15 text-red-600 border-red-500/25',
  scoreboard: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  bracket: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  standing: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  coming_up: 'bg-violet-500/15 text-violet-600 border-violet-500/25',
  break: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
}

// ═══════════════════════════════════════════════
// KOMPONEN
// ═══════════════════════════════════════════════

interface OverlayControllerProps {
  events: MrcEventWithStats[]
  initialCategories: MrcCategory[]
}

export function OverlayController({ events, initialCategories }: OverlayControllerProps) {
  const [isPending, startTransition] = useTransition()

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [categories, setCategories] = useState<MrcCategory[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategories[0]?.id ?? '')

  const [liveState, setLiveState] = useState<MrcLiveState | null>(null)
  const [matches, setMatches] = useState<MrcMatchWithTeams[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Break config
  const [breakMessage, setBreakMessage] = useState('Istirahat')
  const [breakTimerMode, setBreakTimerMode] = useState<string>('none')
  const [breakCountdown, setBreakCountdown] = useState('5')

  // Coming up config
  const [comingUpMessage, setComingUpMessage] = useState('Pertandingan Selanjutnya')
  const [comingUpMatchId, setComingUpMatchId] = useState('')
  const [comingUpTimerMode, setComingUpTimerMode] = useState<string>('none')
  const [comingUpCountdown, setComingUpCountdown] = useState('5')

  const loadData = useCallback((eventId: string, categoryId: string) => {
    if (!categoryId) return
    startTransition(async () => {
      const [lsRes, mRes] = await Promise.all([
        getLiveState(eventId, categoryId),
        getMatchesByCategory(eventId, categoryId),
      ])

      if (lsRes.data) {
        setLiveState(lsRes.data)
        setBreakMessage(lsRes.data.break_message ?? 'Istirahat')
        setBreakTimerMode(lsRes.data.break_timer_mode ?? 'none')
        setBreakCountdown(String((lsRes.data.break_countdown ?? 300) / 60))
        setComingUpMessage(lsRes.data.coming_up_message ?? 'Pertandingan Selanjutnya')
        setComingUpMatchId(lsRes.data.coming_up_match_id ?? '')
        setComingUpTimerMode(lsRes.data.coming_up_timer_mode ?? 'none')
        setComingUpCountdown(String((lsRes.data.coming_up_countdown ?? 300) / 60))
      }
      if (mRes.data) setMatches(mRes.data)
    })
  }, [startTransition])

  useEffect(() => {
    if (selectedEventId && selectedCategoryId) loadData(selectedEventId, selectedCategoryId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEventChange = async (id: string) => {
    setSelectedEventId(id)
    setLiveState(null)
    const result = await getCategoriesByEvent(id)
    const cats = result.data ?? []
    setCategories(cats)
    const cat = cats[0]?.id ?? ''
    setSelectedCategoryId(cat)
    if (cat) loadData(id, cat)
  }

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id)
    loadData(selectedEventId, id)
  }

  /** Ganti active scene */
  const handleSceneChange = (scene: MrcOverlayScene) => {
    startTransition(async () => {
      const result = await updateLiveState(selectedEventId, selectedCategoryId, {
        active_scene: scene,
      })
      if (result.data) {
        setLiveState(result.data)
        setFeedback({ type: 'success', msg: `Scene diubah ke "${MRC_OVERLAY_SCENE_LABELS[scene]}"` })
      } else {
        setFeedback({ type: 'error', msg: result.error ?? 'Gagal' })
      }
      setTimeout(() => setFeedback(null), 3000)
    })
  }

  /** Simpan konfigurasi break */
  const handleSaveBreak = () => {
    startTransition(async () => {
      const countdown = (parseInt(breakCountdown) || 5) * 60
      const result = await updateLiveState(selectedEventId, selectedCategoryId, {
        break_message: breakMessage,
        break_timer_mode: breakTimerMode as MrcLiveState['break_timer_mode'],
        break_countdown: countdown,
        break_timer_status: 'stopped',
      })
      if (result.data) {
        setLiveState(result.data)
        setFeedback({ type: 'success', msg: 'Konfigurasi break tersimpan.' })
      }
      setTimeout(() => setFeedback(null), 3000)
    })
  }

  /** Simpan konfigurasi coming up */
  const handleSaveComingUp = () => {
    startTransition(async () => {
      const countdown = (parseInt(comingUpCountdown) || 5) * 60
      const result = await updateLiveState(selectedEventId, selectedCategoryId, {
        coming_up_match_id: comingUpMatchId || null,
        coming_up_message: comingUpMessage,
        coming_up_timer_mode: comingUpTimerMode as MrcLiveState['coming_up_timer_mode'],
        coming_up_countdown: countdown,
        coming_up_timer_status: 'stopped',
      })
      if (result.data) {
        setLiveState(result.data)
        setFeedback({ type: 'success', msg: 'Konfigurasi coming up tersimpan.' })
      }
      setTimeout(() => setFeedback(null), 3000)
    })
  }

  /** Start timer break/coming up */
  const handleStartTimer = (type: 'break' | 'coming_up') => {
    startTransition(async () => {
      const now = new Date().toISOString()
      const updates = type === 'break'
        ? { break_timer_status: 'running' as const, break_started_at: now }
        : { coming_up_timer_status: 'running' as const, coming_up_started_at: now }
      const result = await updateLiveState(selectedEventId, selectedCategoryId, updates)
      if (result.data) setLiveState(result.data)
    })
  }

  const activeScene = liveState?.active_scene ?? 'none'

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Event</Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="size-3" /> Kategori</Label>
          <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Pilih" /></SelectTrigger>
            <SelectContent>{categories.filter((c) => c.is_active).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {/* Active scene indicator */}
        <Badge variant="outline" className={`h-9 px-3 gap-1.5 ${SCENE_COLORS[activeScene]}`}>
          <Radio className="size-3" />
          Scene: {MRC_OVERLAY_SCENE_LABELS[activeScene]}
        </Badge>
      </div>

      {/* Scene switcher */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <Label className="text-sm font-semibold">Pilih Scene Aktif</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MRC_OVERLAY_SCENES.map((scene) => {
            const Icon = SCENE_ICONS[scene]
            const isActive = activeScene === scene
            return (
              <button
                key={scene}
                type="button"
                onClick={() => handleSceneChange(scene)}
                disabled={isPending}
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs transition-all cursor-pointer ${
                  isActive
                    ? `${SCENE_COLORS[scene]} font-semibold shadow-sm`
                    : 'border-border hover:bg-accent/50'
                }`}
              >
                <Icon className="size-4" />
                <span>{MRC_OVERLAY_SCENE_LABELS[scene]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Konfigurasi Break */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Coffee className="size-4 text-orange-500" />
          <Label className="text-sm font-semibold">Konfigurasi Istirahat</Label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Pesan</Label>
            <Input value={breakMessage} onChange={(e) => setBreakMessage(e.target.value)} placeholder="Istirahat" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mode Timer</Label>
            <Select value={breakTimerMode} onValueChange={setBreakTimerMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Timer</SelectItem>
                <SelectItem value="countdown">Countdown</SelectItem>
                <SelectItem value="target_time">Target Jam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {breakTimerMode === 'countdown' && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Timer className="size-3" /> Durasi (menit)</Label>
              <Input type="number" min={1} max={60} value={breakCountdown} onChange={(e) => setBreakCountdown(e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveBreak} disabled={isPending} className="cursor-pointer">
            {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
            Simpan
          </Button>
          {breakTimerMode !== 'none' && (
            <Button size="sm" variant="outline" onClick={() => handleStartTimer('break')} disabled={isPending} className="cursor-pointer">
              ▶ Mulai Timer
            </Button>
          )}
        </div>
      </div>

      {/* Konfigurasi Coming Up */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-violet-500" />
          <Label className="text-sm font-semibold">Konfigurasi Pertandingan Selanjutnya</Label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Pesan</Label>
            <Input value={comingUpMessage} onChange={(e) => setComingUpMessage(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Match Berikutnya</Label>
            <Select value={comingUpMatchId} onValueChange={setComingUpMatchId}>
              <SelectTrigger><SelectValue placeholder="Pilih match" /></SelectTrigger>
              <SelectContent>
                {matches.filter((m) => m.status === 'upcoming').map((m, i) => (
                  <SelectItem key={m.id} value={m.id}>
                    #{i + 1} {m.team_a_name} vs {m.team_b_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mode Timer</Label>
            <Select value={comingUpTimerMode} onValueChange={setComingUpTimerMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Timer</SelectItem>
                <SelectItem value="countdown">Countdown</SelectItem>
                <SelectItem value="target_time">Target Jam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {comingUpTimerMode === 'countdown' && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Timer className="size-3" /> Durasi (menit)</Label>
              <Input type="number" min={1} max={60} value={comingUpCountdown} onChange={(e) => setComingUpCountdown(e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveComingUp} disabled={isPending} className="cursor-pointer">
            {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
            Simpan
          </Button>
          {comingUpTimerMode !== 'none' && (
            <Button size="sm" variant="outline" onClick={() => handleStartTimer('coming_up')} disabled={isPending} className="cursor-pointer">
              ▶ Mulai Timer
            </Button>
          )}
        </div>
      </div>

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

export function OverlayControllerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[220px] rounded-md" /></div>
        <div className="space-y-1.5"><Skeleton className="h-3 w-16 rounded" /><Skeleton className="h-9 w-[200px] rounded-md" /></div>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((j) => <Skeleton key={j} className="h-9 rounded-md" />)}</div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}
