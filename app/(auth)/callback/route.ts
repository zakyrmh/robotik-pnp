import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // BERHASIL: Arahkan ke halaman sukses verifikasi (path /verified)
      return NextResponse.redirect(`${origin}/verified`);
    }

    // Log error ke terminal jika pertukaran kode gagal
    console.error("Auth Exchange Error:", error.message);
  }

  // GAGAL: Kembali ke register dengan pesan error
  return NextResponse.redirect(
    `${origin}/register?error=Verifikasi+email+gagal.+Pastikan+URL+browser+Anda+sama+dengan+link+email.`,
  );
}
