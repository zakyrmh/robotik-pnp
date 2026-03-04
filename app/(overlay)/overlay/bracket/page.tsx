'use client'

/**
 * Overlay Bracket — /overlay/bracket?event=xxx&cat=xxx
 *
 * Menampilkan bracket eliminasi.
 * Kolom per stage, card per match.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STAGE_ORDER = ['round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final'] as const
const STAGE_LABELS: Record<string, string> = {
  round_of_16: '16 Besar',
  quarterfinal: 'Perempat Final',
  semifinal: 'Semi Final',
  third_place: 'Juara 3',
  final: 'Final',
}

interface BracketMatch {
  id: string
  stage: string
  team_a_id: string | null
  team_b_id: string | null
  score_a: number
  score_b: number
  winner_id: string | null
  status: string
  bracket_position: number | null
}

export default function BracketOverlay() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const categoryId = searchParams.get('cat') ?? ''
  const supabase = createClient()

  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [teamNames, setTeamNames] = useState<Map<string, string>>(new Map())

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('mrc_matches')
      .select('id, stage, team_a_id, team_b_id, score_a, score_b, winner_id, status, bracket_position')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .neq('stage', 'group_stage')
      .order('bracket_position')

    if (!data) return
    setMatches(data as BracketMatch[])

    // Batch fetch team names
    const ids = new Set<string>()
    for (const m of data) {
      if (m.team_a_id) ids.add(m.team_a_id)
      if (m.team_b_id) ids.add(m.team_b_id)
    }
    if (ids.size > 0) {
      const { data: teams } = await supabase
        .from('mrc_teams')
        .select('id, team_name')
        .in('id', Array.from(ids))
      const map = new Map<string, string>()
      for (const t of teams ?? []) map.set(t.id, t.team_name)
      setTeamNames(map)
    }
  }, [eventId, categoryId, supabase])

  useEffect(() => {
    if (eventId && categoryId) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, categoryId])

  // Realtime
  useEffect(() => {
    if (!eventId) return
    const channel = supabase
      .channel('overlay-bracket')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mrc_matches', filter: `event_id=eq.${eventId}` }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Group by stage
  const byStage = new Map<string, BracketMatch[]>()
  for (const m of matches) {
    const arr = byStage.get(m.stage) ?? []
    arr.push(m)
    byStage.set(m.stage, arr)
  }
  const visibleStages = STAGE_ORDER.filter((s) => byStage.has(s))

  if (visibleStages.length === 0) return <div className="fixed inset-0 bg-transparent" />

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center">
      <div className="flex gap-3 items-center">
        {visibleStages.map((stage, si) => (
          <div key={stage} className="flex items-center gap-3">
            <div className="shrink-0 w-[220px]">
              {/* Stage label */}
              <div className="text-center mb-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 drop-shadow-md">
                  {STAGE_LABELS[stage] ?? stage}
                </p>
              </div>
              {/* Matches */}
              <div className="space-y-2">
                {(byStage.get(stage) ?? []).map((m) => {
                  const isLive = m.status === 'live'
                  const isFinished = m.status === 'finished'
                  const nameA = m.team_a_id ? teamNames.get(m.team_a_id) ?? 'TBD' : 'TBD'
                  const nameB = m.team_b_id ? teamNames.get(m.team_b_id) ?? 'TBD' : 'TBD'
                  return (
                    <div key={m.id} className={`bg-black/80 backdrop-blur-md rounded-lg border overflow-hidden ${
                      isLive ? 'border-red-500/40' : 'border-white/10'
                    }`}>
                      {/* Tim A */}
                      <div className={`flex items-center justify-between px-3 py-1.5 text-xs text-white ${
                        isFinished && m.winner_id === m.team_a_id ? 'font-bold' : 'opacity-70'
                      }`}>
                        <span className="truncate">{nameA}</span>
                        {isFinished && <span className="font-mono ml-2">{m.score_a}</span>}
                      </div>
                      <div className="h-px bg-white/10" />
                      {/* Tim B */}
                      <div className={`flex items-center justify-between px-3 py-1.5 text-xs text-white ${
                        isFinished && m.winner_id === m.team_b_id ? 'font-bold' : 'opacity-70'
                      }`}>
                        <span className="truncate">{nameB}</span>
                        {isFinished && <span className="font-mono ml-2">{m.score_b}</span>}
                      </div>
                      {isLive && (
                        <div className="bg-red-500/20 px-2 py-0.5 text-[9px] text-red-400 text-center font-bold">
                          🔴 LIVE
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Connector arrow */}
            {si < visibleStages.length - 1 && (
              <div className="text-white/20 text-lg shrink-0">›</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
