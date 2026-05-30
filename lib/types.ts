// Shared data types for signals + trades. Pure types — safe to import from
// either client or server code (no runtime, no secrets).

export type Signal = {
  id: string
  ticker: string
  signal: 'Buy' | 'Sell' | 'Hold'
  confidence: number
  rationale: string
  created_at: string
  status?: string
}

export type Trade = {
  id: string
  ticker: string
  execution_status: 'executed' | 'rejected'
  entry_price: number
  entry_qty: number
  entry_time: string
  exit_price: number | null
  exit_time: string | null
  exit_status: string | null
  realized_pnl: number | null
  exit_order_id: string | null
  created_at: string
}
