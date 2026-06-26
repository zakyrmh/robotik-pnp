// lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rate limiting cache (in-memory)
const ipCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 menit
const MAX_REQUESTS = 3; // Maksimal 3 request per IP per menit

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

  // Rate Limiting untuk API Hubungi Kami
  const { pathname } = request.nextUrl;
  if (pathname === "/api/contact" && request.method === "POST") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const now = Date.now();
    const clientRate = ipCache.get(ip);

    if (!clientRate) {
      ipCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
      if (now > clientRate.resetTime) {
        ipCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      } else {
        if (clientRate.count >= MAX_REQUESTS) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error:
                "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.",
            }),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        clientRate.count += 1;
      }
    }
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

  // 2. Ambil data profil (is_onboarded) dan registrasi jika user sudah login
  let profile: { role: string; is_onboarded: boolean } | null = null;
  let regStatus: string | null = null;
  let deletedAt: string | null = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "role, is_onboarded, registrations(status, deleted_at, delete_reason)",
      )
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
          deletedAt = regs[0]?.deleted_at || null;
        } else {
          const regObj = regs as unknown as {
            status: string | null;
            deleted_at: string | null;
            delete_reason: string | null;
          };
          regStatus = regObj.status || null;
          deletedAt = regObj.deleted_at || null;
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
    "/manajemen-kelompok",
    "/manajemen-caang",
    "/kegiatan-absensi-caang",
  ];
  const protectedRoutes = [
    ...internalProtectedRoutes,
    "/onboarding",
    "/waiting",
    "/rejected",
    "/deleted",
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
    // url.hostname = "localhost";
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Kasus: User Sudah Login
  if (user && profile) {
    let targetRoute: string | null = null;

    if (profile.role === "caang" && deletedAt) {
      // Jika calon anggota di soft-delete, arahkan ke halaman /deleted
      if (
        !matchRoute(pathname, "/deleted") &&
        (isProtectedRoute || isAuthRoute)
      ) {
        targetRoute = "/deleted";
      }
    } else if (profile.role === "caang" && !profile.is_onboarded) {
      // 1. role === 'caang' AND is_onboarded === false AND registrations.status === 'process'
      if (regStatus === "process" || !regStatus) {
        if (
          !matchRoute(pathname, "/onboarding") &&
          (isProtectedRoute || isAuthRoute)
        ) {
          targetRoute = "/onboarding";
        }
      }
      // 2. role === 'caang' AND is_onboarded === false AND registrations.status === 'pending'
      else if (regStatus === "pending") {
        if (
          !matchRoute(pathname, "/waiting") &&
          (isProtectedRoute || isAuthRoute)
        ) {
          targetRoute = "/waiting";
        }
      }
      // 3. role === 'caang' AND is_onboarded === false AND registrations.status === 'rejected'
      else if (regStatus === "rejected") {
        if (
          !matchRoute(pathname, "/rejected") &&
          (isProtectedRoute || isAuthRoute)
        ) {
          targetRoute = "/rejected";
        }
      }
      // Fallback jika statusnya verified tapi is_onboarded masih false
      else if (regStatus === "verified") {
        if (
          isAuthRoute ||
          matchRoute(pathname, "/onboarding") ||
          matchRoute(pathname, "/waiting") ||
          matchRoute(pathname, "/rejected") ||
          matchRoute(pathname, "/deleted")
        ) {
          targetRoute = "/dashboard";
        }
      }
    } else if (profile.role === "caang" && profile.is_onboarded) {
      // Kondisi 5: Caang Resmi Terverifikasi (Masa Pembinaan/OR)
      const allowedCaangRoutes = [
        "/dashboard",
        "/absensi",
        "/kegiatan",
        "/tugas",
      ];
      const isAllowed = allowedCaangRoutes.some((r) => matchRoute(pathname, r));
      if (!isAllowed && (isProtectedRoute || isAuthRoute)) {
        targetRoute = "/dashboard";
      }
    } else if (profile.role === "anggota") {
      // Kondisi 6: Anggota Tetap / Pengurus Lama (Legacy Member)
      const allowedAnggotaRoutes = [
        "/dashboard",
        "/absensi",
        "/kegiatan",
        "/piket",
      ];
      const isAllowed = allowedAnggotaRoutes.some((r) =>
        matchRoute(pathname, r),
      );
      if (!isAllowed && (isProtectedRoute || isAuthRoute)) {
        targetRoute = "/dashboard";
      }
    } else {
      // User sudah onboarded (is_onboarded === true) ATAU role bukan caang/anggota (admin, dll)
      if (
        isAuthRoute ||
        matchRoute(pathname, "/onboarding") ||
        matchRoute(pathname, "/waiting") ||
        matchRoute(pathname, "/rejected") ||
        matchRoute(pathname, "/deleted")
      ) {
        targetRoute = "/dashboard";
      }
    }

    if (targetRoute && pathname !== targetRoute) {
      const url = request.nextUrl.clone();
      // url.hostname = "localhost";
      url.pathname = targetRoute;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
