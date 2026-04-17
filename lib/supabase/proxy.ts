import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import {
  decodeJwtClaims,
  isBypassRole,
  hasRole,
  hasDepartment,
} from "./claims";

// ── Aturan akses per modul ──
interface RouteRule {
  /** RBAC role yang diizinkan (selain bypass roles) */
  roles: string[];
  /** Slug departemen yang diizinkan. null = tidak perlu cek departemen */
  departments: string[] | null;
}

/**
 * Aturan akses per route prefix.
 * Diurutkan dari paling spesifik ke paling umum saat matching.
 */
const ROUTE_RULES: Record<string, RouteRule> = {
  "/dashboard/admin": {
    // Hanya super_admin dan admin — sudah ter-cover BYPASS_ROLES
    // Non-bypass tidak akan pernah sampai sini
    roles: [],
    departments: null,
  },
  "/dashboard/or": {
    roles: ["anggota"],
    departments: ["open-recruitment"],
  },
  "/dashboard/kestari": {
    roles: ["anggota"],
    departments: ["kesekretariatan"],
  },
  "/dashboard/komdis": {
    roles: ["anggota"],
    departments: ["komisi-disiplin"],
  },
  "/dashboard/mrc": {
    // TODO: update setelah role/jabatan MRC ditentukan dari rapat
    roles: ["anggota"],
    departments: null,
  },
  "/dashboard/caang": {
    roles: ["caang"],
    departments: null,
  },
  "/overlay": {
    // TODO: update setelah role MRC ditentukan
    roles: ["anggota"],
    departments: null,
  },
};

/** Path yang memerlukan autentikasi */
const PRIVATE_PATHS = ["/dashboard", "/overlay"];

/**
 * Path auth yang tidak di-redirect meski user sudah login.
 * /callback dan /auth/verified dikecualikan agar proses
 * exchange session tidak terganggu.
 */
const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
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

  // ── 1. Belum login → akses private → redirect login ──
  const isPrivate = PRIVATE_PATHS.some((p) => pathname.startsWith(p));
  if (!user && isPrivate) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Sudah login → akses auth pages → redirect dashboard ──
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── 3. Sudah login → cek akses modul spesifik ──
  if (user && isPrivate) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const claims = session?.access_token
      ? decodeJwtClaims(session.access_token)
      : {
          app_roles: [],
          app_departments: [],
          app_divisions: [],
          app_div_positions: [],
        };
    const bypass = isBypassRole(claims);
    if (bypass) return supabaseResponse;

    // Match route rule paling spesifik dulu (sort by length descending)
    const matchedRoute = Object.keys(ROUTE_RULES)
      .sort((a, b) => b.length - a.length)
      .find((route) => pathname.startsWith(route));

    if (matchedRoute) {
      const rule = ROUTE_RULES[matchedRoute];

      // Cek RBAC role
      const hasRoleAccess = hasRole(claims, ...rule.roles);
      if (!hasRoleAccess) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Cek departemen jika diperlukan
      if (rule.departments !== null) {
        const hasDeptAccess =
          rule.departments === null ||
          hasDepartment(claims, ...rule.departments);
        if (!hasDeptAccess) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }
  }

  return supabaseResponse;
}
