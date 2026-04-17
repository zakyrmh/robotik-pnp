import { useState, useCallback } from 'react'

interface Feedback {
  type: 'success' | 'error'
  msg: string
}

export function useFeedback(duration = 4000) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const showFeedback = useCallback((type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), duration)
  }, [duration])

  const FeedbackUI = feedback ? (
    <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
      feedback.type === 'error'
        ? 'border-destructive/30 bg-destructive/10 text-destructive'
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
    }`}>
      {feedback.msg}
    </div>
  ) : null

  return { showFeedback, FeedbackUI }
}