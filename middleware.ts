import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only protect the /admin route and its sub-routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = request.headers.get('authorization')
    
    // We expect the user to provide ADMIN_USER and ADMIN_PASSWORD in their environment variables.
    // Basic Auth string format: "Basic base64(user:password)"
    const adminUser = process.env.ADMIN_USER || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || '036'
    const expectedAuth = `Basic ${btoa(`${adminUser}:${adminPassword}`)}`

    if (basicAuth !== expectedAuth) {
      return new NextResponse('Auth Required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Admin Area"',
        },
      })
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
}
