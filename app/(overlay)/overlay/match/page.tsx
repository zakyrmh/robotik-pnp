'use client'

/**
 * Overlay Match — /overlay/match?event=xxx&cat=xxx
 *
 * Overlay utama yang ditampilkan di OBS saat pertandingan berlangsung.
 * Menampilkan nama tim A & B + timer countdown.
 *
 * Elemen:
 * - Nama Tim A (kiri bawah)
 * - Nama Tim B (kanan bawah)
 * - Timer countdown (tengah atas)
 * - Skor (tengah bawah)
 *
 * Data diambil via Supabase Realtime subscription.
 * Background transparan — artwork overlay di-layer terpisah di OBS.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════

function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60)
  const s = Math.max(0, seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ═══════════════════════════════════════════════
// TIPE
// ═══════════════════════════════════════════════

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
  timer_duration: number
  timer_remaining: number
  timer_status: string
  timer_started_at: string | null
}

interface TeamInfo {
  team_name: string
  institution: string
}

// ═══════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════

export default function MatchOverlayPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const categoryId = searchParams.get('cat') ?? ''

  const supabase = createClient()

  // State
  const [match, setMatch] = useState<MatchData | null>(null)
  const [teamA, setTeamA] = useState<TeamInfo | null>(null)
  const [teamB, setTeamB] = useState<TeamInfo | null>(null)
  const [timerDisplay, setTimerDisplay] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Ambil data match live */
  const fetchLiveMatch = useCallback(async () => {
    // Cari match yang sedang live untuk kategori ini
    const { data } = await supabase
      .from('mrc_matches')
      .select('*')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .eq('status', 'live')
      .limit(1)
      .single()

    if (data) {
      setMatch(data as MatchData)
      setTimerDisplay(data.timer_remaining)

      // Ambil nama tim
      if (data.team_a_id) {
        const { data: tA } = await supabase
          .from('mrc_teams')
          .select('team_name, institution')
          .eq('id', data.team_a_id)
          .single()
        if (tA) setTeamA(tA)
      }
      if (data.team_b_id) {
        const { data: tB } = await supabase
          .from('mrc_teams')
          .select('team_name, institution')
          .eq('id', data.team_b_id)
          .single()
        if (tB) setTeamB(tB)
      }
    }
  }, [eventId, categoryId, supabase])

  // Initial fetch
  useEffect(() => {
    if (eventId && categoryId) fetchLiveMatch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, categoryId])

  // Realtime subscription
  useEffect(() => {
    if (!eventId || !categoryId) return

    const channel = supabase
      .channel('overlay-match')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mrc_matches',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newData = payload.new as MatchData
          if (newData && newData.status === 'live') {
            setMatch(newData)
            // Sync timer
            if (newData.timer_status === 'running' && newData.timer_started_at) {
              const elapsed = Math.floor(
                (Date.now() - new Date(newData.timer_started_at).getTime()) / 1000
              )
              setTimerDisplay(Math.max(0, newData.timer_remaining - elapsed))
            } else {
              setTimerDisplay(newData.timer_remaining)
            }
            // Reload team names jika berubah
            fetchLiveMatch()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, categoryId])

  // Timer countdown lokal
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    if (match?.timer_status === 'running' && timerDisplay > 0) {
      timerRef.current = setInterval(() => {
        setTimerDisplay((prev) => {
          if (prev <= 0) {
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
  }, [match?.timer_status, timerDisplay])

  // Computed
  const displayA = match?.is_swapped ? teamB : teamA
  const displayB = match?.is_swapped ? teamA : teamB
  const scoreA = match?.is_swapped ? match.score_b : match?.score_a ?? 0
  const scoreB = match?.is_swapped ? match.score_a : match?.score_b ?? 0
  const isTimerDanger = timerDisplay <= 30 && match?.timer_status === 'running'

  if (!match) {
    return <div className="fixed inset-0 bg-transparent" />
  }

  return (
    <div className="fixed inset-0 bg-transparent text-white">
      {/* Timer — tengah atas */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <div className={`text-6xl font-black tabular-nums tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${
          isTimerDanger ? 'text-red-500 animate-pulse' : ''
        }`}>
          {formatTime(timerDisplay)}
        </div>
        <p className="text-center text-xs mt-1 opacity-70 drop-shadow-md">
          Babak {match.current_round} dari {match.total_rounds}
        </p>
      </div>

      {/* Nama Tim A — kiri bawah */}
      <div className="absolute bottom-6 left-8">
        <p className="text-2xl font-black uppercase tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {displayA?.team_name ?? 'Tim A'}
        </p>
        <p className="text-xs opacity-70 drop-shadow-md">
          {displayA?.institution ?? ''}
        </p>
      </div>

      {/* Skor — tengah bawah */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <span className="text-5xl font-black tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {scoreA}
        </span>
        <span className="text-lg font-bold opacity-50 drop-shadow-md">VS</span>
        <span className="text-5xl font-black tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {scoreB}
        </span>
      </div>

      {/* Nama Tim B — kanan bawah */}
      <div className="absolute bottom-6 right-8 text-right">
        <p className="text-2xl font-black uppercase tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {displayB?.team_name ?? 'Tim B'}
        </p>
        <p className="text-xs opacity-70 drop-shadow-md">
          {displayB?.institution ?? ''}
        </p>
      </div>
    </div>
  )
}
