import type { Signal, Trade } from './types'

// Client-safe fetch helpers. All Supabase access is now server-side behind the
// password-gated API routes (RLS denies the anon role entirely), so the browser
// talks to /api/* instead of Supabase directly.

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function fetchSignals(): Promise<Signal[]> {
  return (await getJSON<{ signals: Signal[] }>('/api/signals')).signals
}

export async function fetchTrades(): Promise<Trade[]> {
  return (await getJSON<{ trades: Trade[] }>('/api/trades')).trades
}

export async function fetchOpenPositions(): Promise<Trade[]> {
  return (await getJSON<{ trades: Trade[] }>('/api/trades?status=open')).trades
}

export async function fetchClosedTrades(): Promise<Trade[]> {
  return (await getJSON<{ trades: Trade[] }>('/api/trades?status=closed')).trades
}
