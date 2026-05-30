import { NextRequest, NextResponse } from 'next/server'
import { getTrades, getOpenPositions, getClosedTrades } from '@/lib/supabase.server'

export const dynamic = 'force-dynamic'

// GET /api/trades            → all trades (PerfChart)
// GET /api/trades?status=open   → open positions
// GET /api/trades?status=closed → closed trades (History)
export async function GET(request: NextRequest) {
  // Session auth check — same gate as /api/positions.
  const session = request.cookies.get('dashboard_auth')?.value
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get('status')

  try {
    const trades =
      status === 'open'
        ? await getOpenPositions()
        : status === 'closed'
          ? await getClosedTrades()
          : await getTrades()
    return NextResponse.json({ trades })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch trades'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
