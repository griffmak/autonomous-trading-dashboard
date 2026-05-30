import { NextRequest, NextResponse } from 'next/server'
import { getSignals } from '@/lib/supabase.server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Session auth check — same gate as /api/positions.
  const session = request.cookies.get('dashboard_auth')?.value
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const signals = await getSignals()
    return NextResponse.json({ signals })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch signals'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
