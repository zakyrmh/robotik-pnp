import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Daftar halaman yang butuh authentication
const protectedRoutes = [
  "/dashboard",
  "/caang-management",
  "/activity-management",
  "/attendance-management",
  "/group-management",
  "/timeline",
  "/presence",
  "/material",
  "/group",
];

// Daftar halaman auth yang tidak boleh diakses jika sudah login
const authRoutes = ["/login", "/forgot-password", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah user memiliki session cookie
  // Firebase session cookie yang di-set dari /api/auth/session
  const sessionCookie = request.cookies.get("session")?.value;
  const hasSessionCookie = !!sessionCookie;

  // Cek apakah halaman yang diakses adalah protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Cek apakah halaman yang diakses adalah auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // CASE 1: Protected route tanpa session cookie → redirect ke login
  // Catatan: Ini TIDAK menjamin user masih authenticated di Firebase
  // Validasi sebenarnya terjadi di client-side via onAuthStateChanged
  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    console.log(
      "[Middleware] No session cookie, redirecting to login. redirect=",
      pathname
    );
    return NextResponse.redirect(loginUrl);
  }

  // CASE 2: Auth route dengan session cookie → redirect ke dashboard
  // Catatan: Jika session sudah expired tapi cookie masih ada,
  // client-side useAuth akan handle dengan menghapus cookie dan redirect
  if (isAuthRoute && hasSessionCookie) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    console.log(
      "[Middleware] Has session cookie on auth route, redirecting to dashboard/redirect param"
    );
    return NextResponse.redirect(
      new URL(redirectParam || "/dashboard", request.url)
    );
  }

  // Lanjutkan request normal
  return NextResponse.next();
}

// Config matcher untuk menentukan path mana yang diproses middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/caang-management/:path*",
    "/activity-management/:path*",
    "/attendance-management/:path*",
    "/group-management/:path*",
    "/timeline",
    "/presence",
    "/material",
    "/group",
    "/login",
    "/forgot-password",
    "/register",
  ],
};
