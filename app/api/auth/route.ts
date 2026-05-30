import { NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env.server'

export async function POST(request: NextRequest) {
  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { password } = body

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  if (password !== serverEnv.DASHBOARD_PASSWORD_SECRET) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  // Set session cookie (7-day expiry)
  const response = NextResponse.json({ success: true })
  response.cookies.set('dashboard_auth', 'authenticated', {
    maxAge: 7 * 24 * 60 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('dashboard_auth')
  return response
}
