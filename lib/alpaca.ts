import 'server-only'
import { serverEnv } from './env.server'

export type AlpacaPosition = {
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

export async function getAlpacaPositions(): Promise<AlpacaPosition[]> {
  const url = `${serverEnv.ALPACA_BASE_URL}/positions`

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': serverEnv.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': serverEnv.ALPACA_SECRET_KEY,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    // AbortSignal.timeout() rejects with a DOMException whose name is
    // 'TimeoutError' (and 'AbortError' in some runtimes). Normalize both
    // into a clean Error so the route handler surfaces a stable message.
    if (
      err instanceof DOMException &&
      (err.name === 'TimeoutError' || err.name === 'AbortError')
    ) {
      throw new Error('Alpaca request timed out')
    }
    throw err
  }

  if (!response.ok) {
    const body = await response.text()
    console.error('[alpaca] positions request failed', response.status, body)
    throw new Error(`Alpaca positions request failed: ${response.status}`)
  }

  const data = (await response.json()) as AlpacaPosition[]
  return data
}
