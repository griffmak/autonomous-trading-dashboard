import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/api/auth']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public paths + static files
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('dashboard_auth')?.value

  if (!sessionCookie) {
    // Redirect to login (root page shows password form)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon).*)'],
}
