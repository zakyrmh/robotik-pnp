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

  // 1. Ambil data user dari Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 2. Ambil data profil (is_onboarded) jika user sudah login
  let profile = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_onboarded")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Kesalahan kueri profil:", error.message);
    } else {
      profile = data;
    }
  }

  // Definisi Rute
  const authRoutes = ["/register", "/login"];
  const protectedRoutes = ["/dashboard", "/onboarding", "/pendaftaran"];
  const isAuthCallback = pathname === "/callback";

  if (isAuthCallback) return supabaseResponse;

  // 3. LOGIKA REDIRECT

  // Kasus: User Belum Login
  if (!user && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.hostname = "localhost";
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Kasus: User Sudah Login
  if (user) {
    // A. Belum Onboarding (is_onboarded = false)
    // Jika mencoba akses apapun selain /onboarding, tendang ke /onboarding
    if (profile && !profile.is_onboarded && pathname !== "/onboarding") {
      if (!authRoutes.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.hostname = "localhost";
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }

    // B. Sudah Onboarding (is_onboarded = true)
    // Jika mencoba akses /onboarding atau halaman login, tendang ke /dashboard
    if (profile?.is_onboarded) {
      if (pathname === "/onboarding" || authRoutes.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.hostname = "localhost";
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
