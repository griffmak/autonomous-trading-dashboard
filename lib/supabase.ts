import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { env } from './env'

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

// Fetch all signals with real-time subscription
export async function getSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

// Fetch all trades with real-time subscription
export async function getTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Fetch open positions only
export async function getOpenPositions(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('execution_status', 'executed')
    .is('exit_status', null)
    .order('entry_time', { ascending: false })

  if (error) throw error
  return data || []
}

// Fetch closed trades only
export async function getClosedTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('execution_status', 'executed')
    .not('exit_status', 'is', null)
    .not('realized_pnl', 'is', null)
    .order('exit_time', { ascending: false })

  if (error) throw error
  return data || []
}

// Real-time subscription helper
export function subscribeToSignals(
  callback: (signal: Signal) => void
) {
  return supabase
    .channel(`realtime:signals:${crypto.randomUUID()}`)
    .on<RealtimePostgresChangesPayload<Signal>>(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'signals',
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          callback(payload.new as Signal)
        }
      }
    )
    .subscribe()
}

export function subscribeToTrades(
  callback: (trade: Trade) => void
) {
  return supabase
    .channel(`realtime:trades:${crypto.randomUUID()}`)
    .on<RealtimePostgresChangesPayload<Trade>>(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trades',
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          callback(payload.new as Trade)
        }
      }
    )
    .subscribe()
}

// Fully tear down a channel (unsubscribe + deregister from the client).
// Plain channel.unsubscribe() leaves the channel registered, so with unique
// channel names stale channels would accumulate across StrictMode/navigation cycles.
export function unsubscribe(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}
