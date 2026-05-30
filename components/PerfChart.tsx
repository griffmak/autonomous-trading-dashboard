'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getTrades, subscribeToTrades, unsubscribe, type Trade } from '@/lib/supabase'
import { formatPnL, formatPrice, formatPercent, getPnLColor } from '@/lib/utils'
import OverviewCard from '@/components/OverviewCard'

// Slow full re-fetch backup; real-time subscription handles instant updates.
const POLL_INTERVAL_MS = 300_000

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ACCENT = '#0ea5e9'

export function PerfChart() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getTrades()
        if (!cancelled) {
          setTrades(data)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load trades')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)

    // subscribeToTrades fires on ALL trade changes. Merge the changed row into
    // the trades state; the useMemo below re-derives closed-trade metrics + chart.
    // The 5-min re-fetch is the source of truth.
    const subscription = subscribeToTrades((newTrade) => {
      if (cancelled) return
      setTrades((prev) => [newTrade, ...prev.filter((t) => t.id !== newTrade.id)])
    })

    return () => {
      cancelled = true
      clearInterval(interval)
      unsubscribe(subscription)
    }
  }, [])

  const metrics = useMemo(() => {
    const closed = trades
      .filter(
        (t) =>
          t.execution_status === 'executed' &&
          t.exit_status != null &&
          t.realized_pnl != null
      )
      .sort((a, b) => {
        const at = a.exit_time ? Date.parse(a.exit_time) : 0
        const bt = b.exit_time ? Date.parse(b.exit_time) : 0
        return at - bt
      })

    const winners = closed.filter((t) => (t.realized_pnl as number) > 0)
    const losers = closed.filter((t) => (t.realized_pnl as number) < 0)

    const total = closed.length
    const winRate = total > 0 ? (winners.length / total) * 100 : 0
    const avgWin =
      winners.length > 0
        ? winners.reduce((s, t) => s + (t.realized_pnl as number), 0) /
          winners.length
        : 0
    const avgLoss =
      losers.length > 0
        ? losers.reduce((s, t) => s + (t.realized_pnl as number), 0) /
          losers.length
        : 0
    const totalPnL = closed.reduce((s, t) => s + (t.realized_pnl as number), 0)

    let running = 0
    const cumulative = closed.map((t) => {
      running += t.realized_pnl as number
      return running
    })
    const labels = closed.map((t, i) =>
      t.exit_time ? new Date(t.exit_time).toLocaleDateString() : `#${i + 1}`
    )

    return {
      closed,
      total,
      winRate,
      avgWin,
      avgLoss,
      totalPnL,
      cumulative,
      labels,
    }
  }, [trades])

  if (loading) return <p className="p-4 text-slate-400">Loading performance…</p>
  if (error) return <p className="p-4 text-red-400">Error: {error}</p>
  if (metrics.total === 0)
    return <p className="p-4 text-slate-400">No closed trades yet.</p>

  const chartData = {
    labels: metrics.labels,
    datasets: [
      {
        label: 'Cumulative P&L',
        data: metrics.cumulative,
        borderColor: ACCENT,
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        pointBackgroundColor: ACCENT,
        pointRadius: 3,
        tension: 0.25,
        fill: true,
      },
    ],
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1' },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => formatPnL(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        ticks: {
          color: '#94a3b8',
          callback: (value) => formatPrice(Number(value)),
        },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
    },
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <OverviewCard label="Total Trades" value={String(metrics.total)} />
        <OverviewCard label="Win Rate" value={formatPercent(metrics.winRate / 100)} />
        <OverviewCard
          label="Avg Win"
          value={formatPnL(metrics.avgWin)}
          valueClassName={getPnLColor(metrics.avgWin)}
        />
        <OverviewCard
          label="Avg Loss"
          value={formatPnL(metrics.avgLoss)}
          valueClassName={getPnLColor(metrics.avgLoss)}
        />
        <OverviewCard
          label="Total P&L"
          value={formatPnL(metrics.totalPnL)}
          valueClassName={getPnLColor(metrics.totalPnL)}
        />
      </div>

      <div className="bg-trading-slate rounded p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cumulative P&amp;L</h2>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}
