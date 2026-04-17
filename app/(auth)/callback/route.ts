import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // 'signup' | 'recovery' — dikirim Supabase otomatis
  const next = searchParams.get("next"); // custom redirect, contoh: ?next=/reset-password

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "signup") {
        // Flow verifikasi email registrasi baru
        return NextResponse.redirect(`${origin}/auth/verified`);
      }

      // Flow reset password atau login magic link
      return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
    }
  }

  // Fallback: code tidak ada atau exchange gagal
  return NextResponse.redirect(
    `${origin}/login?error=Link+tidak+valid+atau+kadaluarsa`,
  );
}
