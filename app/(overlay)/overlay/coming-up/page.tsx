'use client'

/**
 * Overlay Coming Up — /overlay/coming-up?event=xxx&cat=xxx
 *
 * Mengumumkan pertandingan selanjutnya.
 * Menampilkan nama tim + countdown opsional.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ComingUpOverlay() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const categoryId = searchParams.get('cat') ?? ''
  const supabase = createClient()

  const [message, setMessage] = useState('Pertandingan Selanjutnya')
  const [teamAName, setTeamAName] = useState('')
  const [teamBName, setTeamBName] = useState('')
  const [timerDisplay, setTimerDisplay] = useState(0)
  const [hasTimer, setHasTimer] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchState = useCallback(async () => {
    const { data } = await supabase
      .from('mrc_live_state')
      .select('coming_up_match_id, coming_up_message, coming_up_timer_mode, coming_up_countdown, coming_up_target, coming_up_timer_status, coming_up_started_at')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .single()

    if (!data) return
    setMessage(data.coming_up_message ?? 'Pertandingan Selanjutnya')

    // Timer
    const mode = data.coming_up_timer_mode
    if (mode === 'countdown' && data.coming_up_countdown) {
      setHasTimer(true)
      if (data.coming_up_timer_status === 'running' && data.coming_up_started_at) {
        const elapsed = Math.floor((Date.now() - new Date(data.coming_up_started_at).getTime()) / 1000)
        setTimerDisplay(Math.max(0, data.coming_up_countdown - elapsed))
      } else {
        setTimerDisplay(data.coming_up_countdown)
      }
    } else if (mode === 'target_time' && data.coming_up_target) {
      setHasTimer(true)
      const diff = Math.floor((new Date(data.coming_up_target).getTime() - Date.now()) / 1000)
      setTimerDisplay(Math.max(0, diff))
    } else {
      setHasTimer(false)
    }

    // Ambil nama tim dari match
    if (data.coming_up_match_id) {
      const { data: m } = await supabase
        .from('mrc_matches')
        .select('team_a_id, team_b_id')
        .eq('id', data.coming_up_match_id)
        .single()

      if (m) {
        if (m.team_a_id) {
          const { data: t } = await supabase.from('mrc_teams').select('team_name').eq('id', m.team_a_id).single()
          if (t) setTeamAName(t.team_name)
        }
        if (m.team_b_id) {
          const { data: t } = await supabase.from('mrc_teams').select('team_name').eq('id', m.team_b_id).single()
          if (t) setTeamBName(t.team_name)
        }
      }
    }
  }, [eventId, categoryId, supabase])

  useEffect(() => {
    if (eventId && categoryId) fetchState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, categoryId])

  // Realtime
  useEffect(() => {
    if (!eventId) return
    const channel = supabase
      .channel('overlay-coming-up')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mrc_live_state' }, () => fetchState())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Countdown lokal
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (hasTimer && timerDisplay > 0) {
      timerRef.current = setInterval(() => {
        setTimerDisplay((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hasTimer, timerDisplay > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center">
      <div className="text-center text-white max-w-[800px]">
        {/* Judul */}
        <p className="text-lg uppercase tracking-[0.3em] opacity-60 drop-shadow-md mb-4">
          {message}
        </p>

        {/* Tim vs Tim */}
        {(teamAName || teamBName) && (
          <div className="flex items-center justify-center gap-6 mb-6">
            <p className="text-3xl font-black uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {teamAName || 'TBD'}
            </p>
            <p className="text-xl font-bold opacity-40">VS</p>
            <p className="text-3xl font-black uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {teamBName || 'TBD'}
            </p>
          </div>
        )}

        {/* Timer */}
        {hasTimer && timerDisplay > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest opacity-40 mb-1">Dimulai dalam</p>
            <p className="text-5xl font-black tabular-nums drop-shadow-[0_3px_16px_rgba(0,0,0,0.8)]">
              {formatTime(timerDisplay)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
