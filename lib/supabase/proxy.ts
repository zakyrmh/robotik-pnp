// lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 1. Definisikan pengecualian rute verifikasi
  const isAuthCallback = pathname === "/callback";
  const isVerifyPage = pathname === "/verify-email";
  const isAuthGroup = pathname.startsWith("/auth/");

  const authRoutes = ["/register", "/login"];
  const protectedRoutes = ["/dashboard", "/onboarding"];

  // 2. Cegah redirect loop jika sedang di rute callback
  if (isAuthCallback) return supabaseResponse;

  // 3. Redirect unauthenticated
  if (!user && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.hostname = "localhost"; // Paksa tetap di IP
    url.pathname = "/register";
    return NextResponse.redirect(url);
  }

  // 4. Redirect confirmed users away from auth
  if (
    user &&
    user.email_confirmed_at &&
    authRoutes.some((r) => pathname.startsWith(r))
  ) {
    const url = request.nextUrl.clone();
    url.hostname = "localhost";
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 5. PERBAIKAN: Izinkan rute callback untuk user yang belum konfirmasi
  if (
    user &&
    !user.email_confirmed_at &&
    !isVerifyPage &&
    !isAuthGroup &&
    !isAuthCallback
  ) {
    if (!authRoutes.some((r) => pathname.startsWith(r))) {
      const url = request.nextUrl.clone();
      url.hostname = "localhost";
      url.pathname = "/verify-email";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
