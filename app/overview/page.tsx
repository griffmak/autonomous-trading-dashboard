'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import OverviewCard from '@/components/OverviewCard'
import {
  getOpenPositions,
  getSignals,
  type Signal,
  type Trade,
} from '@/lib/supabase'
import {
  formatConfidence,
  formatPrice,
  formatRelativeTime,
  getSignalColor,
} from '@/lib/utils'

export default function OverviewPage() {
  const [openPositions, setOpenPositions] = useState<Trade[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([getOpenPositions(), getSignals()])
      .then(([positions, sigs]) => {
        if (cancelled) return
        setOpenPositions(positions)
        setSignals(sigs)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const latestSignal = signals[0] ?? null
  const recentSignals = signals.slice(0, 10)

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Overview</h1>

        {loading ? (
          <p className="text-slate-400">Loading overview…</p>
        ) : error ? (
          <p className="text-red-400">Failed to load: {error}</p>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <OverviewCard
                label="Total Unrealized P&L"
                value="—"
                valueClassName="text-slate-400"
                hint="live prices in /positions"
              />
              <OverviewCard
                label="Open Positions"
                value={String(openPositions.length)}
              />
              <OverviewCard
                label="Latest Signal"
                value={
                  latestSignal
                    ? `${latestSignal.ticker} ${latestSignal.signal}`
                    : '—'
                }
                valueClassName={
                  latestSignal ? getSignalColor(latestSignal.signal) : undefined
                }
                hint={
                  latestSignal
                    ? formatRelativeTime(latestSignal.created_at)
                    : undefined
                }
              />
              <OverviewCard
                label="Latest Confidence"
                value={
                  latestSignal ? formatConfidence(latestSignal.confidence) : '—'
                }
              />
            </section>

            <section className="bg-trading-slate rounded p-6 space-y-3">
              <h2 className="text-xl font-semibold">Open Positions</h2>
              {openPositions.length === 0 ? (
                <p className="text-sm text-slate-400">No open positions</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Qty</th>
                      <th>Entry Price</th>
                      <th>Entry Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((pos) => (
                      <tr key={pos.id}>
                        <td className="font-semibold">{pos.ticker}</td>
                        <td>{pos.entry_qty}</td>
                        <td>{formatPrice(pos.entry_price)}</td>
                        <td>{formatRelativeTime(pos.entry_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-trading-slate rounded p-6 space-y-3">
              <h2 className="text-xl font-semibold">Recent Signals</h2>
              {recentSignals.length === 0 ? (
                <p className="text-sm text-slate-400">No signals yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Signal</th>
                      <th>Confidence</th>
                      <th>Rationale</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSignals.map((sig) => (
                      <tr key={sig.id}>
                        <td className="font-semibold">{sig.ticker}</td>
                        <td className={getSignalColor(sig.signal)}>
                          {sig.signal}
                        </td>
                        <td>{formatConfidence(sig.confidence)}</td>
                        <td
                          className="max-w-md truncate"
                          title={sig.rationale}
                        >
                          {sig.rationale}
                        </td>
                        <td>{formatRelativeTime(sig.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}
