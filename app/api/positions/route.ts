import { NextRequest, NextResponse } from 'next/server'
import { getAlpacaPositions } from '@/lib/alpaca'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Session auth check
  const session = request.cookies.get('dashboard_auth')?.value
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const positions = await getAlpacaPositions()
    return NextResponse.json({ positions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch positions'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
