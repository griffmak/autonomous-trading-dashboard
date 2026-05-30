// Formatting + color helpers (pure functions, no React).

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return currencyFormatter.format(value)
}

export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 1
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(fractionDigits)}%`
}

export function formatPnL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

export function formatConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export function getSignalColor(signal: 'Buy' | 'Sell' | 'Hold'): string {
  if (signal === 'Buy') return 'text-emerald-400'
  if (signal === 'Sell') return 'text-red-400'
  return 'text-slate-400'
}

export function getPnLColor(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'text-slate-400'
  }
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-slate-400'
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return '—'

  const diffMs = Date.now() - then
  const diffSec = Math.max(0, Math.floor(diffMs / 1000))

  if (diffSec < 60) return 'just now'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`

  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth}mo ago`

  const diffYear = Math.max(1, Math.floor(diffDay / 365))
  return `${diffYear}y ago`
}

export function formatHoldDuration(
  entryTime: string,
  exitTime: string | null
): string {
  if (!exitTime) return '—'

  const diffMs = new Date(exitTime).getTime() - new Date(entryTime).getTime()
  const hours = diffMs / (1000 * 60 * 60)
  const days = hours / 24

  if (days < 1) return `${Math.max(1, Math.round(hours))}h`
  return `${Math.floor(days)}d`
}
