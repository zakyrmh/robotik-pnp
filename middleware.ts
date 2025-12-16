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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah user memiliki session cookie
  // Firebase session cookie biasanya bernama '__session' atau custom name
  const sessionCookie = request.cookies.get("session")?.value;
  const isAuthenticated = !!sessionCookie;

  // Cek apakah halaman yang diakses adalah protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Cek apakah halaman yang diakses adalah auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // CASE 1: Sama, tapi tambah logging
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    console.log("Middleware: Redirecting to login with redirect=", pathname); // Logging server-side
    return NextResponse.redirect(loginUrl);
  }
  // CASE 2: Ubah agar respect param redirect jika ada (untuk avoid override)
  if (isAuthRoute && isAuthenticated) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
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
