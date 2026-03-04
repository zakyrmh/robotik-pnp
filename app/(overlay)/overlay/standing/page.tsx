'use client'

/**
 * Overlay Standing — /overlay/standing?event=xxx&cat=xxx
 *
 * Menampilkan klasemen grup saat ini.
 * Tabel per grup dengan posisi, nama tim, poin.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface GroupStanding {
  group_name: string
  teams: Array<{
    team_name: string
    played: number
    wins: number
    draws: number
    losses: number
    points: number
  }>
}

export default function StandingOverlay() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const categoryId = searchParams.get('cat') ?? ''
  const supabase = createClient()

  const [standings, setStandings] = useState<GroupStanding[]>([])

  const fetchData = useCallback(async () => {
    const { data: groups } = await supabase
      .from('mrc_groups')
      .select('id, group_name')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .order('group_name')

    if (!groups) return

    const result: GroupStanding[] = []
    for (const g of groups) {
      const { data: gTeams } = await supabase
        .from('mrc_group_teams')
        .select('played, wins, draws, losses, points, mrc_teams(team_name)')
        .eq('group_id', g.id)
        .order('points', { ascending: false })
        .order('score_for', { ascending: false })

      result.push({
        group_name: g.group_name,
        teams: (gTeams ?? []).map((t) => {
          const raw = t.mrc_teams
          const teamData = Array.isArray(raw) ? raw[0] : raw
          return {
            team_name: (teamData as { team_name?: string })?.team_name ?? '—',
            played: t.played,
            wins: t.wins,
            draws: t.draws,
            losses: t.losses,
            points: t.points,
          }
        }),
      })
    }
    setStandings(result)
  }, [eventId, categoryId, supabase])

  useEffect(() => {
    if (eventId && categoryId) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, categoryId])

  // Realtime
  useEffect(() => {
    if (!eventId) return
    const channel = supabase
      .channel('overlay-standing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mrc_group_teams' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  if (standings.length === 0) return <div className="fixed inset-0 bg-transparent" />

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center">
      <div className="flex flex-wrap gap-4 max-w-[1600px] justify-center">
        {standings.map((g) => (
          <div key={g.group_name} className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden min-w-[320px]">
            {/* Header */}
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
              <p className="text-sm font-bold text-white uppercase tracking-wider">{g.group_name}</p>
            </div>
            {/* Tabel */}
            <table className="w-full text-white text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-1.5 text-left opacity-50 font-medium">#</th>
                  <th className="px-2 py-1.5 text-left opacity-50 font-medium">Tim</th>
                  <th className="px-2 py-1.5 text-center opacity-50 font-medium">M</th>
                  <th className="px-2 py-1.5 text-center opacity-50 font-medium">W</th>
                  <th className="px-2 py-1.5 text-center opacity-50 font-medium">D</th>
                  <th className="px-2 py-1.5 text-center opacity-50 font-medium">L</th>
                  <th className="px-3 py-1.5 text-center font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {g.teams.map((t, idx) => (
                  <tr key={idx} className={`border-b border-white/5 ${idx < 2 ? 'bg-emerald-500/10' : ''}`}>
                    <td className="px-3 py-2 font-bold opacity-60">{idx + 1}</td>
                    <td className="px-2 py-2 font-medium truncate max-w-[180px]">{t.team_name}</td>
                    <td className="px-2 py-2 text-center opacity-60">{t.played}</td>
                    <td className="px-2 py-2 text-center text-emerald-400">{t.wins}</td>
                    <td className="px-2 py-2 text-center opacity-60">{t.draws}</td>
                    <td className="px-2 py-2 text-center text-red-400">{t.losses}</td>
                    <td className="px-3 py-2 text-center font-bold">{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
