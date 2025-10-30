import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Daftar halaman yang butuh authentication
const protectedRoutes = [
  '/dashboard',
  '/activity-management',
  '/peserta-mrc',
  '/volunteer-mrc-management',
  '/activity',
  '/events',
]

// Daftar halaman auth yang tidak boleh diakses jika sudah login
const authRoutes = ['/login', '/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Cek apakah user memiliki session cookie
  // Firebase session cookie biasanya bernama '__session' atau custom name
  const sessionCookie = request.cookies.get('session')?.value
  const isAuthenticated = !!sessionCookie
  
  // Cek apakah halaman yang diakses adalah protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Cek apakah halaman yang diakses adalah auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // CASE 1: User belum login tapi akses protected route
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    // Simpan halaman tujuan untuk redirect setelah login
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // CASE 2: User sudah login tapi akses halaman login/forgot-password
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Lanjutkan request normal
  return NextResponse.next()
}

// Config matcher untuk menentukan path mana yang diproses middleware
export const config = {
  matcher: [
    // Protected routes
    '/dashboard/:path*',
    '/activity-management/:path*',
    '/peserta-mrc/:path*',
    '/volunteer-mrc-management/:path*',
    '/activity/:path*',
    '/events/:path*',
    // Auth routes
    '/login',
    '/forgot-password',
  ],
}