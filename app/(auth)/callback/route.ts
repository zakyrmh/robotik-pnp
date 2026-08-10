import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/verified";

  if (code) {
    const forwardUrl = next.startsWith("/") ? `${origin}${next}` : next;
    const response = NextResponse.redirect(forwardUrl);

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
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sign out HANYA untuk verifikasi email pendaftaran akun baru (next === "/verified").
      // JANGAN sign out untuk pembaruan email profil (/settings), reset password, atau navigasi terautentikasi lainnya.
      if (next === "/verified") {
        await supabase.auth.signOut();
      }
      return response;
    }

    // Log error ke terminal jika pertukaran kode gagal
    console.error("Auth Exchange Error:", error.message);
  }

  // GAGAL: Kembali ke login dengan pesan error
  return NextResponse.redirect(
    `${origin}/login?error=Verifikasi+link+gagal+atau+sudah+kadaluwarsa.+Silakan+coba+lagi.`,
  );
}
