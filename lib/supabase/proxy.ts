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
  let profile: { role: string; is_onboarded: boolean } | null = null;
  let regStatus: string | null = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_onboarded, registrations(status)")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Kesalahan kueri profil:", error.message);
    } else if (data) {
      profile = {
        role: data.role,
        is_onboarded: data.is_onboarded,
      };
      if (data.registrations) {
        const regs = data.registrations;
        if (Array.isArray(regs)) {
          regStatus = regs[0]?.status || null;
        } else {
          regStatus = (regs as { status: string }).status || null;
        }
      }
    }
  }

  // Definisi Rute
  const authRoutes = ["/register", "/login", "/verify-email"];
  const internalProtectedRoutes = [
    "/dashboard",
    "/kegiatan",
    "/absensi",
    "/tugas",
    "/magang",
    "/piket",
    "/manajemen-kelompok"
  ];
  const protectedRoutes = [
    ...internalProtectedRoutes,
    "/onboarding",
    "/waiting",
    "/rejected"
  ];
  const isAuthCallback = pathname === "/callback";

  if (isAuthCallback) return supabaseResponse;

  const matchRoute = (path: string, route: string) => {
    return path === route || path.startsWith(route + "/");
  };

  const isProtectedRoute = protectedRoutes.some((r) => matchRoute(pathname, r));
  const isAuthRoute = authRoutes.some((r) => matchRoute(pathname, r));

  // Kasus: User Belum Login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.hostname = "localhost";
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Kasus: User Sudah Login
  if (user && profile) {
    let targetRoute: string | null = null;

    if (profile.role === "caang" && !profile.is_onboarded) {
      // 1. role === 'caang' AND is_onboarded === false AND registrations.status === 'process'
      if (regStatus === "process" || !regStatus) {
        if (!matchRoute(pathname, "/onboarding") && (isProtectedRoute || isAuthRoute)) {
          targetRoute = "/onboarding";
        }
      }
      // 2. role === 'caang' AND is_onboarded === false AND registrations.status === 'pending'
      else if (regStatus === "pending") {
        if (!matchRoute(pathname, "/waiting") && (isProtectedRoute || isAuthRoute)) {
          targetRoute = "/waiting";
        }
      }
      // 3. role === 'caang' AND is_onboarded === false AND registrations.status === 'rejected'
      else if (regStatus === "rejected") {
        if (!matchRoute(pathname, "/rejected") && (isProtectedRoute || isAuthRoute)) {
          targetRoute = "/rejected";
        }
      }
      // Fallback jika statusnya verified tapi is_onboarded masih false
      else if (regStatus === "verified") {
        if (
          isAuthRoute ||
          matchRoute(pathname, "/onboarding") ||
          matchRoute(pathname, "/waiting") ||
          matchRoute(pathname, "/rejected")
        ) {
          targetRoute = "/dashboard";
        }
      }
    } else {
      // User sudah onboarded (is_onboarded === true) ATAU role bukan caang (anggota, admin, dll)
      if (
        isAuthRoute ||
        matchRoute(pathname, "/onboarding") ||
        matchRoute(pathname, "/waiting") ||
        matchRoute(pathname, "/rejected")
      ) {
        targetRoute = "/dashboard";
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
