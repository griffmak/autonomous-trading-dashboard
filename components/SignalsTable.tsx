'use client'

import { useEffect, useState } from 'react'
import { getSignals, subscribeToSignals, unsubscribe, type Signal } from '@/lib/supabase'
import { formatConfidence, formatRelativeTime, getSignalColor } from '@/lib/utils'

// Slow full re-fetch backup; real-time subscription handles instant updates.
const POLL_INTERVAL_MS = 300_000

export function SignalsTable() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getSignals()
        if (!cancelled) {
          setSignals(data)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load signals')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)

    const subscription = subscribeToSignals((newSignal) => {
      if (cancelled) return
      // Intentional: '*' events mean an UPDATE re-surfaces an old signal to row 0; the 5-min poll re-sorts.
      setSignals((prev) => [newSignal, ...prev.filter((s) => s.id !== newSignal.id)])
    })

    return () => {
      cancelled = true
      clearInterval(interval)
      unsubscribe(subscription)
    }
  }, [])

  if (loading) return <p className="p-4 text-slate-400">Loading signals…</p>
  if (error) return <p className="p-4 text-red-400">Error: {error}</p>
  if (signals.length === 0) return <p className="p-4 text-slate-400">No signals yet.</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Signal</th>
          <th>Confidence</th>
          <th>Rationale</th>
          <th>Status</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {signals.map((sig) => (
          <tr key={sig.id}>
            <td className="font-semibold">{sig.ticker}</td>
            <td className={`font-semibold ${getSignalColor(sig.signal)}`}>{sig.signal}</td>
            <td>{formatConfidence(sig.confidence)}</td>
            <td className="max-w-md truncate" title={sig.rationale}>{sig.rationale}</td>
            <td className="text-slate-400 text-sm">{sig.status ?? '—'}</td>
            <td className="text-slate-400">{formatRelativeTime(sig.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
