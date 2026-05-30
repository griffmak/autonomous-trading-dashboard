'use client'

import { useEffect, useState } from 'react'
import { getClosedTrades, subscribeToTrades, unsubscribe, type Trade } from '@/lib/supabase'
import { formatPrice, formatPnL, getPnLColor, formatHoldDuration } from '@/lib/utils'

// Slow full re-fetch backup; real-time subscription handles instant updates.
const POLL_INTERVAL_MS = 300_000

// A trade belongs in history only once it is canonically closed.
function isClosedTrade(trade: Trade): boolean {
  return (
    trade.execution_status === 'executed' &&
    trade.exit_status != null &&
    trade.realized_pnl != null
  )
}

export function HistoryTable() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getClosedTrades()
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

    // subscribeToTrades fires on ALL trade changes; only merge canonically
    // closed trades into history. The 5-min re-fetch is the source of truth.
    const subscription = subscribeToTrades((newTrade) => {
      if (cancelled || !isClosedTrade(newTrade)) return
      setTrades((prev) => [newTrade, ...prev.filter((t) => t.id !== newTrade.id)])
    })

    return () => {
      cancelled = true
      clearInterval(interval)
      unsubscribe(subscription)
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
