// lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // -------------------------------------------------------
  // PENTING: Next.js Server Actions dikirim sebagai POST
  // dengan header "Next-Action". Middleware TIDAK boleh
  // memodifikasi response dari server actions karena akan
  // merusak payload response (menyebabkan "message channel closed").
  // -------------------------------------------------------
  const isServerAction = request.headers.has("next-action");
  if (isServerAction) {
    return NextResponse.next({ request });
  }

  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies pada request (untuk downstream)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Set cookies pada response yang sudah ada (JANGAN buat NextResponse baru)
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

  // 2. Ambil data profil (is_onboarded) dan registrasi jika user sudah login
  let profile = null;
  let regStatus = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_onboarded, registrations(status)")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Kesalahan kueri profil:", error.message);
    } else {
      profile = data;
      if (data.registrations) {
        regStatus = Array.isArray(data.registrations)
          ? data.registrations[0]?.status
          : (data.registrations as { status: string }).status;
      }
    }
  }

  // Definisi Rute
  const authRoutes = ["/register", "/login"];
  const protectedRoutes = ["/dashboard", "/onboarding", "/pendaftaran", "/waiting", "/rejected"];
  const isAuthCallback = pathname === "/callback";

  if (isAuthCallback) return supabaseResponse;

  // 3. LOGIKA REDIRECT
  const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.includes(pathname);

  // Kasus: User Belum Login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.hostname = "localhost";
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Kasus: User Sudah Login
  if (user && profile) {
    let targetRoute = null;

    if (["anggota", "super-admin", "admin-or"].includes(profile.role)) {
      // Role admin/anggota: bisa ke /dashboard, tidak bisa ke /onboarding, /waiting, /rejected
      if (
        isAuthRoute ||
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/waiting") ||
        pathname.startsWith("/rejected")
      ) {
        targetRoute = "/dashboard";
      }
    } else if (profile.role === "caang") {
      // Prioritaskan regStatus jika sudah ada (walaupun is_onboarded mungkin masih false)
      if (regStatus === "process") {
        // Hanya boleh di /onboarding
        if (isAuthRoute || (isProtectedRoute && !pathname.startsWith("/onboarding"))) {
          targetRoute = "/onboarding";
        }
      } else if (regStatus === "pending") {
        // User minta pending dialihkan ke /dashboard
        if (
          isAuthRoute ||
          pathname.startsWith("/onboarding") ||
          pathname.startsWith("/waiting") ||
          pathname.startsWith("/rejected")
        ) {
          targetRoute = "/dashboard";
        }
      } else if (regStatus === "verified") {
        if (
          isAuthRoute ||
          pathname.startsWith("/onboarding") ||
          pathname.startsWith("/waiting") ||
          pathname.startsWith("/rejected")
        ) {
          targetRoute = "/dashboard";
        }
      } else if (regStatus === "rejected") {
        if (isAuthRoute || (isProtectedRoute && !pathname.startsWith("/rejected"))) {
          targetRoute = "/rejected";
        }
      } else if (!profile.is_onboarded) {
        // Belum onboarded: hanya boleh di /onboarding
        if (isAuthRoute || (isProtectedRoute && !pathname.startsWith("/onboarding"))) {
          targetRoute = "/onboarding";
        }
      } else {
        // Fallback
        if (isAuthRoute || pathname.startsWith("/onboarding")) {
          targetRoute = "/dashboard";
        }
      }
    }

    if (targetRoute && pathname !== targetRoute) {
      const url = request.nextUrl.clone();
      url.hostname = "localhost";
      url.pathname = targetRoute;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
