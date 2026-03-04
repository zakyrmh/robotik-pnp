'use client'

/**
 * BracketManager — Komponen client untuk melihat klasemen
 * grup dan bracket eliminasi MRC.
 *
 * Fitur:
 * - Tab: Klasemen Grup | Bracket Eliminasi
 * - Tabel standing per grup (poin, menang, seri, kalah, selisih skor)
 * - Bracket eliminasi visual (pohon pertandingan)
 * - Jadwal pertandingan per tahap
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  Trophy,
  Users,
  Filter,
  Loader2,
  ChevronRight,
  Swords,
} from 'lucide-react'

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
  getCategoriesByEvent,
  getGroupStandings,
  getMatchesByCategory,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type {
  MrcCategory,
  MrcGroup,
  MrcGroupTeamWithInfo,
  MrcMatchWithTeams,
  MrcMatchStage,
} from '@/lib/db/schema/mrc'
import {
  MRC_MATCH_STAGE_LABELS,
  MRC_MATCH_STATUS_LABELS,
} from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface BracketManagerProps {
  events: MrcEventWithStats[]
  initialCategories: MrcCategory[]
}

type TabView = 'standing' | 'bracket'

export function BracketManager({ events, initialCategories }: BracketManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [categories, setCategories] = useState<MrcCategory[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategories[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState<TabView>('standing')

  // Data
  const [groupData, setGroupData] = useState<Array<{ group: MrcGroup; teams: MrcGroupTeamWithInfo[] }>>([])
  const [allMatches, setAllMatches] = useState<MrcMatchWithTeams[]>([])

  const loadCategories = useCallback((eventId: string) => {
    startTransition(async () => {
      const result = await getCategoriesByEvent(eventId)
      const cats = result.data ?? []
      setCategories(cats)
      setSelectedCategoryId(cats[0]?.id ?? '')
    })
  }, [startTransition])

  const loadData = useCallback((eventId: string, categoryId: string) => {
    if (!categoryId) return
    startTransition(async () => {
      const [grpRes, matchRes] = await Promise.all([
        getGroupStandings(eventId, categoryId),
        getMatchesByCategory(eventId, categoryId),
      ])
      if (grpRes.data) setGroupData(grpRes.data)
      if (matchRes.data) setAllMatches(matchRes.data)
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
    setGroupData([])
    setAllMatches([])
    loadCategories(id)
  }

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id)
    loadData(selectedEventId, id)
  }

  // Pisahkan match berdasarkan stage
  const groupMatches = allMatches.filter((m) => m.stage === 'group_stage')
  const elimMatches = allMatches.filter((m) => m.stage !== 'group_stage')

  // Grup eliminasi berdasarkan stage
  const elimByStage = new Map<MrcMatchStage, MrcMatchWithTeams[]>()
  for (const m of elimMatches) {
    const arr = elimByStage.get(m.stage) ?? []
    arr.push(m)
    elimByStage.set(m.stage, arr)
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

      {/* Tab */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <TabButton active={activeTab === 'standing'} onClick={() => setActiveTab('standing')} icon={Users} label="Klasemen Grup" />
        <TabButton active={activeTab === 'bracket'} onClick={() => setActiveTab('bracket')} icon={Swords} label="Bracket Eliminasi" />
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat data...
        </div>
      )}

      {/* Konten Tab */}
      {activeTab === 'standing' ? (
        <StandingView groupData={groupData} matches={groupMatches} />
      ) : (
        <BracketView elimByStage={elimByStage} />
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// TAB: Klasemen Grup
// ═════════════════════════════════════════════════════

function StandingView({
  groupData,
  matches,
}: {
  groupData: Array<{ group: MrcGroup; teams: MrcGroupTeamWithInfo[] }>
  matches: MrcMatchWithTeams[]
}) {
  if (groupData.length === 0) {
    return <EmptyState message="Belum ada data grup. Lakukan drawing terlebih dahulu." />
  }

  return (
    <div className="space-y-4">
      {/* Standing per grup */}
      {groupData.map(({ group, teams }) => (
        <div key={group.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-accent/30 border-b">
            <p className="text-sm font-semibold">{group.group_name}</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Tim</TableHead>
                  <TableHead className="text-center w-10">M</TableHead>
                  <TableHead className="text-center w-10">W</TableHead>
                  <TableHead className="text-center w-10">D</TableHead>
                  <TableHead className="text-center w-10">L</TableHead>
                  <TableHead className="text-center w-16">SF</TableHead>
                  <TableHead className="text-center w-16">SA</TableHead>
                  <TableHead className="text-center w-16">+/-</TableHead>
                  <TableHead className="text-center w-12 font-bold">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t, idx) => (
                  <TableRow key={t.id} className={idx < 2 ? 'bg-emerald-500/5' : ''}>
                    <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{t.team_name}</p>
                        <p className="text-xs text-muted-foreground">{t.institution}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">{t.played}</TableCell>
                    <TableCell className="text-center text-xs text-emerald-600">{t.wins}</TableCell>
                    <TableCell className="text-center text-xs">{t.draws}</TableCell>
                    <TableCell className="text-center text-xs text-red-500">{t.losses}</TableCell>
                    <TableCell className="text-center text-xs">{t.score_for}</TableCell>
                    <TableCell className="text-center text-xs">{t.score_against}</TableCell>
                    <TableCell className="text-center text-xs font-mono">
                      {t.score_for - t.score_against > 0 ? '+' : ''}{t.score_for - t.score_against}
                    </TableCell>
                    <TableCell className="text-center font-bold">{t.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Jadwal match grup */}
      {matches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Jadwal Pertandingan Grup</h3>
          <div className="rounded-xl border bg-card shadow-sm divide-y">
            {matches.map((m, idx) => (
              <MatchRow key={m.id} match={m} number={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// TAB: Bracket Eliminasi
// ═════════════════════════════════════════════════════

function BracketView({
  elimByStage,
}: {
  elimByStage: Map<MrcMatchStage, MrcMatchWithTeams[]>
}) {
  if (elimByStage.size === 0) {
    return <EmptyState message="Belum ada bracket eliminasi. Selesaikan fase grup terlebih dahulu." />
  }

  // Urutkan stages
  const stageOrder: MrcMatchStage[] = [
    'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final',
  ]
  const sortedStages = stageOrder.filter((s) => elimByStage.has(s))

  return (
    <div className="space-y-4">
      {/* Bracket horizontal */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedStages.map((stage, stageIdx) => {
          const stageMatches = elimByStage.get(stage)!
          return (
            <div key={stage} className="shrink-0 w-[240px]">
              {/* Stage header */}
              <div className="rounded-t-lg bg-accent/50 px-3 py-2 border border-b-0 text-center">
                <p className="text-xs font-semibold">{MRC_MATCH_STAGE_LABELS[stage]}</p>
              </div>
              {/* Matches */}
              <div className="border rounded-b-lg bg-card divide-y space-y-0">
                {stageMatches.map((m) => (
                  <BracketMatchCard key={m.id} match={m} />
                ))}
              </div>
              {/* Arrow */}
              {stageIdx < sortedStages.length - 1 && (
                <div className="flex items-center justify-center py-2">
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Card pertandingan bracket */
function BracketMatchCard({ match }: { match: MrcMatchWithTeams }) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <div className={`p-2.5 ${isLive ? 'bg-red-500/5' : ''}`}>
      {/* Tim A */}
      <div className={`flex items-center justify-between text-xs py-1 ${
        isFinished && match.winner_id === match.team_a_id ? 'font-bold' : 'text-muted-foreground'
      }`}>
        <span className="truncate flex-1">{match.team_a_name}</span>
        {isFinished && <span className="font-mono ml-2">{match.score_a}</span>}
      </div>
      {/* Separator */}
      <div className="flex items-center gap-1.5 py-0.5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[9px] text-muted-foreground">VS</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      {/* Tim B */}
      <div className={`flex items-center justify-between text-xs py-1 ${
        isFinished && match.winner_id === match.team_b_id ? 'font-bold' : 'text-muted-foreground'
      }`}>
        <span className="truncate flex-1">{match.team_b_name}</span>
        {isFinished && <span className="font-mono ml-2">{match.score_b}</span>}
      </div>
      {/* Status */}
      {isLive && (
        <Badge variant="outline" className="text-[8px] px-1 py-0 bg-red-500/15 text-red-600 border-red-500/25 mt-1">
          🔴 LIVE
        </Badge>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN BERSAMA
// ═════════════════════════════════════════════════════

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void
  icon: React.ComponentType<{ className?: string }>; label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
        active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  )
}

function MatchRow({ match, number }: { match: MrcMatchWithTeams; number: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-xs">
      <span className="size-6 flex items-center justify-center rounded-full bg-muted font-bold text-muted-foreground shrink-0">
        {number}
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
        <span className={`truncate ${match.status === 'finished' && match.winner_id === match.team_a_id ? 'font-bold' : ''}`}>
          {match.team_a_name}
        </span>
        <span className="text-muted-foreground shrink-0">vs</span>
        <span className={`truncate ${match.status === 'finished' && match.winner_id === match.team_b_id ? 'font-bold' : ''}`}>
          {match.team_b_name}
        </span>
      </div>
      {match.status === 'finished' ? (
        <span className="font-mono text-xs shrink-0">{match.score_a} - {match.score_b}</span>
      ) : (
        <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${
          match.status === 'live'
            ? 'bg-red-500/15 text-red-700 border-red-500/25'
            : 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25'
        }`}>
          {MRC_MATCH_STATUS_LABELS[match.status]}
        </Badge>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Trophy className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Belum ada data</p>
      <p className="text-xs text-muted-foreground max-w-[300px]">{message}</p>
    </div>
  )
}

export function BracketSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[220px] rounded-md" /></div>
        <div className="space-y-1.5"><Skeleton className="h-3 w-16 rounded" /><Skeleton className="h-9 w-[200px] rounded-md" /></div>
      </div>
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
            <Skeleton className="h-4 w-20 rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full" />
                <div className="flex-1 space-y-1"><Skeleton className="h-4 w-28 rounded" /><Skeleton className="h-3 w-20 rounded" /></div>
                <Skeleton className="h-4 w-8 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
