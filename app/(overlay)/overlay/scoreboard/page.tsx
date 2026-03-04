'use client'

/**
 * Overlay Scoreboard — /overlay/scoreboard?event=xxx&cat=xxx
 *
 * Menampilkan skor detail per babak setelah pertandingan atau antar babak.
 * Tampil sebagai kartu semi-transparan di tengah layar.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MatchData {
  id: string
  team_a_id: string | null
  team_b_id: string | null
  score_a: number
  score_b: number
  current_round: number
  total_rounds: number
  is_swapped: boolean
  status: string
  winner_id: string | null
}

interface RoundData {
  round_number: number
  score_a: number
  score_b: number
}

export default function ScoreboardOverlay() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const categoryId = searchParams.get('cat') ?? ''
  const supabase = createClient()

  const [match, setMatch] = useState<MatchData | null>(null)
  const [rounds, setRounds] = useState<RoundData[]>([])
  const [teamAName, setTeamAName] = useState('Tim A')
  const [teamBName, setTeamBName] = useState('Tim B')

  const fetchData = useCallback(async () => {
    // Ambil match live atau terakhir selesai
    const { data: m } = await supabase
      .from('mrc_matches')
      .select('*')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .in('status', ['live', 'finished'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (!m) return
    setMatch(m as MatchData)

    // Nama tim
    if (m.team_a_id) {
      const { data: t } = await supabase.from('mrc_teams').select('team_name').eq('id', m.team_a_id).single()
      if (t) setTeamAName(t.team_name)
    }
    if (m.team_b_id) {
      const { data: t } = await supabase.from('mrc_teams').select('team_name').eq('id', m.team_b_id).single()
      if (t) setTeamBName(t.team_name)
    }

    // Skor per babak
    const { data: rds } = await supabase
      .from('mrc_match_rounds')
      .select('round_number, score_a, score_b')
      .eq('match_id', m.id)
      .order('round_number')
    if (rds) setRounds(rds)
  }, [eventId, categoryId, supabase])

  useEffect(() => {
    if (eventId && categoryId) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, categoryId])

  // Realtime
  useEffect(() => {
    if (!eventId) return
    const channel = supabase
      .channel('overlay-scoreboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mrc_match_rounds' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mrc_matches', filter: `event_id=eq.${eventId}` }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  if (!match) return <div className="fixed inset-0 bg-transparent" />

  const dA = match.is_swapped ? teamBName : teamAName
  const dB = match.is_swapped ? teamAName : teamBName
  const sA = match.is_swapped ? match.score_b : match.score_a
  const sB = match.is_swapped ? match.score_a : match.score_b
  const isFinished = match.status === 'finished'

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center">
      <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-8 min-w-[500px] text-white shadow-2xl">
        {/* Header */}
        <p className="text-center text-xs uppercase tracking-widest opacity-50 mb-4">
          {isFinished ? 'Hasil Pertandingan' : 'Papan Skor'}
        </p>

        {/* Skor besar */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium opacity-70 mb-1">{dA}</p>
            <p className="text-6xl font-black tabular-nums">{sA}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold opacity-30">VS</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium opacity-70 mb-1">{dB}</p>
            <p className="text-6xl font-black tabular-nums">{sB}</p>
          </div>
        </div>

        {/* Skor per babak */}
        {rounds.length > 0 && (
          <div className="space-y-1.5 border-t border-white/10 pt-4">
            {rounds.map((r) => {
              const rA = match.is_swapped ? r.score_b : r.score_a
              const rB = match.is_swapped ? r.score_a : r.score_b
              return (
                <div key={r.round_number} className="flex items-center justify-between text-sm">
                  <span className="text-xs opacity-50">Babak {r.round_number}</span>
                  <div className="flex gap-4 font-mono">
                    <span className={rA > rB ? 'font-bold text-emerald-400' : 'opacity-60'}>{rA}</span>
                    <span className="opacity-30">-</span>
                    <span className={rB > rA ? 'font-bold text-emerald-400' : 'opacity-60'}>{rB}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pemenang */}
        {isFinished && match.winner_id && (
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-xs uppercase tracking-widest opacity-50">Pemenang</p>
            <p className="text-lg font-black text-amber-400 mt-1">
              🏆 {match.winner_id === match.team_a_id ? teamAName : teamBName}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
