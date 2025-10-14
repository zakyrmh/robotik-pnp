import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname, search } = request.nextUrl;
  
  // Protected routes
  const protectedPaths = ['/dashboard', 'activities', 'volunteer-mrc-management', 'events', 'caang', `volunteer-mrc`];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Jika belum login dan akses protected route
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    // PENTING: Simpan URL tujuan di query parameter 'redirect'
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  }
  
  // Jika sudah login dan akses halaman login
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};