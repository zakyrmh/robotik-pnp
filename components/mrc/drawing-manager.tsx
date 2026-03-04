'use client'

/**
 * DrawingManager — Komponen client untuk drawing grup MRC.
 *
 * Fitur:
 * - Pilih event → pilih kategori
 * - Atur jumlah tim per grup, babak per match, durasi timer
 * - Klik "Drawing" → acak tim ke grup
 * - Lihat hasil drawing (grup + daftar tim)
 * - Generate jadwal pertandingan round-robin
 * - Lihat jadwal yang sudah dibuat
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  Dices,
  Loader2,
  Users,
  CalendarDays,
  CheckCircle2,
  Trophy,
  Shuffle,
  Timer,
  Filter,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
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
  drawGroups,
  generateGroupMatches,
  getGroupStandings,
  getMatchesByCategory,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type {
  MrcCategory,
  MrcGroup,
  MrcGroupTeamWithInfo,
  MrcMatchWithTeams,
} from '@/lib/db/schema/mrc'
import { MRC_MATCH_STATUS_LABELS } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface DrawingManagerProps {
  events: MrcEventWithStats[]
  initialCategories: MrcCategory[]
}

export function DrawingManager({ events, initialCategories }: DrawingManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [categories, setCategories] = useState<MrcCategory[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategories[0]?.id ?? '')

  // Pengaturan drawing
  const [teamsPerGroup, setTeamsPerGroup] = useState('3')
  const [totalRounds, setTotalRounds] = useState('2')
  const [timerMinutes, setTimerMinutes] = useState('2')

  // Hasil
  const [groupData, setGroupData] = useState<Array<{ group: MrcGroup; teams: MrcGroupTeamWithInfo[] }>>([])
  const [matches, setMatches] = useState<MrcMatchWithTeams[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  /** Muat kategori saat event berubah */
  const loadCategories = useCallback((eventId: string) => {
    startTransition(async () => {
      const result = await getCategoriesByEvent(eventId)
      const cats = result.data ?? []
      setCategories(cats)
      setSelectedCategoryId(cats[0]?.id ?? '')
    })
  }, [startTransition])

  /** Muat data grup & jadwal */
  const loadData = useCallback((eventId: string, categoryId: string) => {
    if (!categoryId) return
    startTransition(async () => {
      const [grpRes, matchRes] = await Promise.all([
        getGroupStandings(eventId, categoryId),
        getMatchesByCategory(eventId, categoryId, 'group_stage'),
      ])
      if (grpRes.data) setGroupData(grpRes.data)
      if (matchRes.data) setMatches(matchRes.data)
    })
  }, [startTransition])

  useEffect(() => {
    if (selectedEventId && selectedCategoryId) {
      loadData(selectedEventId, selectedCategoryId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    setFeedback(null)
    setGroupData([])
    setMatches([])
    loadCategories(id)
  }

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id)
    setFeedback(null)
    loadData(selectedEventId, id)
  }

  /** Eksekusi drawing */
  const handleDraw = () => {
    setFeedback(null)
    startTransition(async () => {
      const result = await drawGroups(selectedEventId, selectedCategoryId, parseInt(teamsPerGroup) || 3)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else if (result.data) {
        setFeedback({
          type: 'success',
          message: `Drawing selesai! ${result.data.teams} tim dibagi ke ${result.data.groups} grup.`,
        })
        loadData(selectedEventId, selectedCategoryId)
      }
    })
  }

  /** Generate jadwal pertandingan */
  const handleGenerateMatches = () => {
    setFeedback(null)
    const durationSec = (parseInt(timerMinutes) || 2) * 60
    startTransition(async () => {
      const result = await generateGroupMatches(
        selectedEventId,
        selectedCategoryId,
        parseInt(totalRounds) || 2,
        durationSec
      )
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else if (result.data) {
        setFeedback({
          type: 'success',
          message: `${result.data.matchesCreated} pertandingan berhasil dibuat.`,
        })
        loadData(selectedEventId, selectedCategoryId)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Event & Kategori */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" /> Event
          </Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Trophy className="size-3" /> Kategori
          </Label>
          <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>
              {categories.filter((c) => c.is_active).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pengaturan Drawing */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Dices className="size-4 text-amber-500" /> Pengaturan Drawing
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tim per Grup</Label>
            <Input type="number" min={2} max={10} value={teamsPerGroup} onChange={(e) => setTeamsPerGroup(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Babak per Match</Label>
            <Select value={totalRounds} onValueChange={setTotalRounds}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Babak</SelectItem>
                <SelectItem value="3">3 Babak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Timer className="size-3" /> Durasi Timer</Label>
            <div className="flex items-center gap-1.5">
              <Input type="number" min={1} max={30} value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">menit</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          {/* Drawing button dengan konfirmasi */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isPending || !selectedCategoryId} className="cursor-pointer">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Shuffle className="size-4" />}
                Drawing Grup
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Dices className="size-5 text-amber-500" />
                  Konfirmasi Drawing
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Drawing akan mengacak <strong>semua tim yang sudah terverifikasi</strong> ke
                  dalam grup. Jika sudah ada grup sebelumnya, data lama akan dihapus.
                  Lanjutkan?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDraw}>Ya, Mulai Drawing</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Generate matches */}
          {groupData.length > 0 && (
            <Button variant="outline" disabled={isPending} onClick={handleGenerateMatches} className="cursor-pointer">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              Generate Jadwal Pertandingan
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
        }`}>{feedback.message}</div>
      )}

      {/* Hasil Drawing: Grup */}
      {groupData.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Hasil Drawing</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupData.map(({ group, teams }) => (
              <div key={group.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-accent/30 border-b">
                  <p className="text-sm font-semibold">{group.group_name}</p>
                  <p className="text-xs text-muted-foreground">{teams.length} tim</p>
                </div>
                <div className="divide-y">
                  {teams.map((t, idx) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                      <span className="size-6 flex items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{t.team_name}</p>
                        <p className="text-muted-foreground truncate">{t.institution}</p>
                      </div>
                      <span className="text-muted-foreground font-mono">{t.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jadwal Pertandingan */}
      {matches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="size-4" /> Jadwal Pertandingan Grup
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{matches.length} match</Badge>
          </h2>
          <div className="rounded-xl border bg-card shadow-sm divide-y">
            {matches.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 text-xs">
                <span className="size-6 flex items-center justify-center rounded-full bg-muted font-bold text-muted-foreground shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
                  <span className="font-medium truncate">{m.team_a_name}</span>
                  <span className="text-muted-foreground shrink-0">vs</span>
                  <span className="font-medium truncate">{m.team_b_name}</span>
                </div>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${
                  m.status === 'finished'
                    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25'
                    : m.status === 'live'
                      ? 'bg-red-500/15 text-red-700 border-red-500/25'
                      : 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25'
                }`}>
                  {MRC_MATCH_STATUS_LABELS[m.status]}
                </Badge>
                {m.status === 'finished' && (
                  <span className="font-mono text-xs shrink-0">
                    {m.score_a} - {m.score_b}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// SKELETON
// ═════════════════════════════════════════════════════

export function DrawingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[220px] rounded-md" /></div>
        <div className="space-y-1.5"><Skeleton className="h-3 w-16 rounded" /><Skeleton className="h-9 w-[200px] rounded-md" /></div>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
        <Skeleton className="h-4 w-40 rounded" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 rounded-md" />)}
        </div>
        <Skeleton className="h-px w-full" />
        <div className="flex gap-2"><Skeleton className="h-9 w-32 rounded-md" /><Skeleton className="h-9 w-48 rounded-md" /></div>
      </div>
    </div>
  )
}
