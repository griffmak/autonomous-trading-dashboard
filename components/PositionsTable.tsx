'use client'

import { useEffect, useState } from 'react'
import { getOpenPositions, subscribeToTrades, unsubscribe, type Trade } from '@/lib/supabase'
import {
  formatPrice,
  formatPnL,
  getPnLColor,
  formatRelativeTime,
} from '@/lib/utils'

type AlpacaPosition = {
  symbol: string
  qty: string
  avg_entry_price: string
  current_price: string
  market_value: string
  unrealized_pl: string
  unrealized_plpc: string
  cost_basis: string
  side: 'long' | 'short'
}

type LivePriceMap = Record<string, { currentPrice: number; unrealizedPnL: number }>

// Supabase open-positions backup re-fetch; subscription handles instant updates.
const POSITIONS_POLL_MS = 300_000
// Alpaca live-price poll — no real-time channel exists; keep current cadence.
const LIVE_PRICE_POLL_MS = 10_000

// A trade is an open position only while it has no exit yet.
function isOpenPosition(trade: Trade): boolean {
  return trade.execution_status === 'executed' && trade.exit_status == null
}

async function fetchLivePrices(): Promise<LivePriceMap> {
  const res = await fetch('/api/positions', { cache: 'no-store' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Live prices request failed (${res.status})`)
  }
  const { positions } = (await res.json()) as { positions: AlpacaPosition[] }
  const map: LivePriceMap = {}
  for (const p of positions) {
    map[p.symbol] = {
      currentPrice: Number(p.current_price),
      unrealizedPnL: Number(p.unrealized_pl),
    }
  }
  return map
}

export function PositionsTable() {
  const [positions, setPositions] = useState<Trade[]>([])
  const [livePrices, setLivePrices] = useState<LivePriceMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [livePriceError, setLivePriceError] = useState('')

  useEffect(() => {
    let positionsReqId = 0
    let livePriceReqId = 0
    let cancelled = false

    const loadPositions = async () => {
      const reqId = ++positionsReqId
      try {
        const data = await getOpenPositions()
        if (cancelled || reqId !== positionsReqId) return
        setPositions(data)
        setError('')
      } catch (err) {
        if (cancelled || reqId !== positionsReqId) return
        setError(err instanceof Error ? err.message : 'Failed to load positions')
      } finally {
        if (!cancelled && reqId === positionsReqId) setLoading(false)
      }
    }

    const loadLivePrices = async () => {
      const reqId = ++livePriceReqId
      try {
        const map = await fetchLivePrices()
        if (cancelled || reqId !== livePriceReqId) return
        setLivePrices(map)
        setLivePriceError('')
      } catch (err) {
        if (cancelled || reqId !== livePriceReqId) return
        setLivePriceError(err instanceof Error ? err.message : 'Failed to load live prices')
      }
    }

    loadPositions()
    loadLivePrices()

    const positionsInterval = setInterval(loadPositions, POSITIONS_POLL_MS)
    const livePriceInterval = setInterval(loadLivePrices, LIVE_PRICE_POLL_MS)

    // Real-time Supabase open-positions sync only — does NOT touch Alpaca
    // live prices or the request-id guard. A trade that opens is merged in;
    // one that closes (gets an exit) is removed from the open list.
    const subscription = subscribeToTrades((trade) => {
      if (cancelled) return
      setPositions((prev) => {
        const without = prev.filter((p) => p.id !== trade.id)
        return isOpenPosition(trade) ? [trade, ...without] : without
      })
    })

    return () => {
      cancelled = true
      clearInterval(positionsInterval)
      clearInterval(livePriceInterval)
      unsubscribe(subscription)
    }
  }, [])

  if (loading) return <p className="p-4 text-slate-400">Loading positions…</p>
  if (error) return <p className="p-4 text-red-400">Error: {error}</p>
  if (positions.length === 0) return <p className="p-4 text-slate-400">No open positions.</p>

  return (
    <>
      {livePriceError && (
        <p role="status" aria-live="polite" className="mb-3 text-sm text-amber-400">
          Live prices unavailable: {livePriceError}
        </p>
      )}
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Qty</th>
            <th>Entry Price</th>
            <th>Current Price</th>
            <th>Unrealized P&amp;L</th>
            <th>Entry Time</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const live = livePrices[pos.ticker]
            const currentPrice = live?.currentPrice ?? null
            const unrealizedPnL = live?.unrealizedPnL ?? null
            return (
              <tr key={pos.id}>
                <td className="font-semibold">{pos.ticker}</td>
                <td>{pos.entry_qty}</td>
                <td>{formatPrice(pos.entry_price)}</td>
                <td>{currentPrice !== null ? formatPrice(currentPrice) : '—'}</td>
                <td className={getPnLColor(unrealizedPnL)}>
                  {unrealizedPnL !== null ? formatPnL(unrealizedPnL) : '—'}
                </td>
                <td className="text-slate-400">{formatRelativeTime(pos.entry_time)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
