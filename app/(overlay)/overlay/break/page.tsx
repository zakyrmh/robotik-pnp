'use client'

/**
 * Overlay Break — /overlay/break?event=xxx&cat=xxx
 *
 * Ditampilkan saat istirahat / jeda teknis.
 * Mendukung 3 mode timer:
 * - none: Hanya pesan, tanpa countdown
 * - countdown: Mundur berdasarkan durasi (X menit)
 * - target_time: Mundur ke jam target (HH:MM)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface LiveState {
  break_message: string | null
  break_timer_mode: string
  break_countdown: number | null
  break_target: string | null
  break_timer_status: string
  break_started_at: string | null
}

export default function BreakOverlay() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const categoryId = searchParams.get('cat') ?? ''
  const supabase = createClient()

  const [liveState, setLiveState] = useState<LiveState | null>(null)
  const [timerDisplay, setTimerDisplay] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchState = useCallback(async () => {
    const { data } = await supabase
      .from('mrc_live_state')
      .select('break_message, break_timer_mode, break_countdown, break_target, break_timer_status, break_started_at')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .single()

    if (data) {
      setLiveState(data as LiveState)
      // Hitung timer display
      if (data.break_timer_mode === 'countdown' && data.break_countdown) {
        if (data.break_timer_status === 'running' && data.break_started_at) {
          const elapsed = Math.floor((Date.now() - new Date(data.break_started_at).getTime()) / 1000)
          setTimerDisplay(Math.max(0, data.break_countdown - elapsed))
        } else {
          setTimerDisplay(data.break_countdown)
        }
      } else if (data.break_timer_mode === 'target_time' && data.break_target) {
        const diff = Math.floor((new Date(data.break_target).getTime() - Date.now()) / 1000)
        setTimerDisplay(Math.max(0, diff))
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
      .channel('overlay-break')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mrc_live_state' }, () => fetchState())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Countdown lokal
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (timerDisplay > 0) {
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
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerDisplay > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const message = liveState?.break_message ?? 'Istirahat'
  const hasTimer = liveState?.break_timer_mode !== 'none' && timerDisplay > 0

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center">
      <div className="text-center text-white">
        <p className="text-4xl font-black uppercase tracking-widest drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] animate-pulse">
          {message}
        </p>
        {hasTimer && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest opacity-50 drop-shadow-md mb-2">
              Kembali dalam
            </p>
            <p className="text-7xl font-black tabular-nums drop-shadow-[0_3px_16px_rgba(0,0,0,0.8)]">
              {formatTime(timerDisplay)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
