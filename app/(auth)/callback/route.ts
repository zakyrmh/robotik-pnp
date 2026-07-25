import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/verified";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sign out immediately so user is redirected as guest and must log in manually
      await supabase.auth.signOut();

      const forwardUrl = next.startsWith("/") ? `${origin}${next}` : next;
      return NextResponse.redirect(forwardUrl);
    }

    // Log error ke terminal jika pertukaran kode gagal
    console.error("Auth Exchange Error:", error.message);
  }

  // GAGAL: Kembali ke login dengan pesan error
  return NextResponse.redirect(
    `${origin}/login?error=Verifikasi+link+gagal+atau+sudah+kadaluwarsa.+Silakan+coba+lagi.`,
  );
}
