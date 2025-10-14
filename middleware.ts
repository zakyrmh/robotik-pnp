// middleware.ts (di root project)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authToken")?.value;
  const { pathname, search } = request.nextUrl;

  // Protected routes - HARUS PAKAI "/" di depan
  const protectedPaths = [
    "/dashboard",
    "/activities",
    "/volunteer-mrc-management",
    "/volunteer-mrc",
    "/events",
    "/caang",
    "/profile",
    "/settings",
    "/admin",
    "/reports",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // HANYA CEK PROTECTED PATHS
  // Jika belum login dan akses protected route
  if (!token && isProtectedPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + search);

    // 🔥 DEBUG LOG
    console.log("🔴 Middleware Redirect:", {
      from: pathname + search,
      to: loginUrl.toString(),
    });

    return NextResponse.redirect(loginUrl);
  }

  // HAPUS BAGIAN INI - Biarkan client-side (login page) yang handle redirect
  // JANGAN redirect otomatis dari /login ke /dashboard di middleware

  // Lanjutkan request normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.ico|.*\\.webp).*)",
  ],
};
