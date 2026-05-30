'use client'

import { useEffect, useState } from 'react'
import { fetchClosedTrades } from '@/lib/fetchers'
import type { Trade } from '@/lib/types'
import { formatPrice, formatPnL, getPnLColor, formatHoldDuration } from '@/lib/utils'

// Polling cadence. Realtime subscriptions were removed when RLS was enabled
// (the anon role is denied, so client-side Supabase realtime no longer streams).
const POLL_INTERVAL_MS = 300_000

export function HistoryTable() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await fetchClosedTrades()
        if (!cancelled) {
          setTrades(data)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load trade history')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) return <p className="p-4 text-slate-400">Loading trade history…</p>
  if (error) return <p className="p-4 text-red-400">Error: {error}</p>
  if (trades.length === 0) return <p className="p-4 text-slate-400">No closed trades yet.</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Qty</th>
          <th>Entry Price</th>
          <th>Exit Price</th>
          <th>Realized P&amp;L</th>
          <th>Exit Reason</th>
          <th>Hold Duration</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((trade) => (
          <tr key={trade.id}>
            <td className="font-semibold">{trade.ticker}</td>
            <td>{trade.entry_qty}</td>
            <td>{formatPrice(trade.entry_price)}</td>
            <td>{formatPrice(trade.exit_price)}</td>
            <td className={getPnLColor(trade.realized_pnl)}>{formatPnL(trade.realized_pnl)}</td>
            <td className="text-slate-400 text-sm">{trade.exit_status || '—'}</td>
            <td className="text-slate-400">{formatHoldDuration(trade.entry_time, trade.exit_time)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
