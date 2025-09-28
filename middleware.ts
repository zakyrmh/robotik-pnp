import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Set maintenance mode flag
  const isMaintenanceMode = true // Ubah ke false untuk disable maintenance

  // Skip maintenance untuk admin routes atau API (opsional)
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Skip jika sudah di halaman maintenance
  if (request.nextUrl.pathname === '/maintenance') {
    return NextResponse.next()
  }

  // Redirect ke maintenance jika mode aktif
  if (isMaintenanceMode) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}