import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from './env.server'
import type { Signal, Trade } from './types'

// Server-only Supabase client using the SECRET key (bypasses RLS).
// This never reaches the browser bundle — the 'server-only' import makes any
// client-side import a build-time error. All DB reads run through the
// password-gated API routes that import this module.
const supabaseAdmin = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export async function getSignals(): Promise<Signal[]> {
  const { data, error } = await supabaseAdmin
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getTrades(): Promise<Trade[]> {
  const { data, error } = await supabaseAdmin
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getOpenPositions(): Promise<Trade[]> {
  const { data, error } = await supabaseAdmin
    .from('trades')
    .select('*')
    .eq('execution_status', 'executed')
    .is('exit_status', null)
    .order('entry_time', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getClosedTrades(): Promise<Trade[]> {
  const { data, error } = await supabaseAdmin
    .from('trades')
    .select('*')
    .eq('execution_status', 'executed')
    .not('exit_status', 'is', null)
    .not('realized_pnl', 'is', null)
    .order('exit_time', { ascending: false })

  if (error) throw error
  return data || []
}
