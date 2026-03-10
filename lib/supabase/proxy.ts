import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
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

  /** Daftar path halaman auth yang tidak boleh diakses user yang sudah login */
  const AUTH_PATHS = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  /** Daftar path halaman private yang tidak boleh diakses tanpa login */
  const PRIVATE_PATHS = ["/dashboard"];

  // Redirect ke login jika belum auth dan akses halaman protected
  const isAccessingPrivate = PRIVATE_PATHS.some((path) =>
    pathname.startsWith(path),
  );
  if (!user && isAccessingPrivate) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect ke dashboard jika sudah auth dan akses halaman auth
  const isAccessingAuth = AUTH_PATHS.some((path) => pathname.startsWith(path));
  if (user && isAccessingAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}
