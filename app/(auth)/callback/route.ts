import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/verified";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

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

  const syncProfileEmail = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && user.email) {
      await supabase
        .from("profiles")
        .update({ email: user.email })
        .eq("id", user.id);
    }
  };

  // 1. Jika Supabase Auth mengembalikan query error (misal: link expired/invalid)
  if (errorParam) {
    console.error("Auth Callback Error:", errorParam, errorDescription);
    const decodedError = encodeURIComponent(errorDescription || errorParam);
    const targetUrl =
      next.startsWith("/") && next !== "/verified"
        ? `${origin}${next}?error=${decodedError}`
        : `${origin}/login?error=${decodedError}`;
    return NextResponse.redirect(targetUrl);
  }

  // 2. Alur PKCE: Memiliki otorisasi 'code'
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await syncProfileEmail();
      if (next === "/verified") {
        await supabase.auth.signOut();
      }
      return response;
    }
    console.error("Auth Exchange Error:", error.message);
  }
  // 3. Alur OTP: Memiliki 'token_hash' dan 'type'
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      await syncProfileEmail();
      if (next === "/verified") {
        await supabase.auth.signOut();
      }
      return response;
    }
    console.error("Auth Verify OTP Error:", error.message);
  }

  // 4. Pengecekan sesi pengguna (Fallback jika exchangeCodeForSession / verifyOtp dikonsumsi lebih dulu oleh Supabase Auth server di /auth/v1/verify)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncProfileEmail();
    if (next === "/verified") {
      await supabase.auth.signOut();
      return response;
    }
    // Jika dari update email (next === "/settings"), tambahkan query param pesan sukses jika belum ada
    const redirectUrl = new URL(forwardUrl);
    if (
      next.startsWith("/settings") &&
      !redirectUrl.searchParams.has("message")
    ) {
      redirectUrl.searchParams.set(
        "message",
        "Alamat email berhasil diperbarui.",
      );
      return NextResponse.redirect(redirectUrl.toString());
    }
    return response;
  }

  // GAGAL: Tidak ada token valid dan user tidak memiliki sesi aktif
  return NextResponse.redirect(
    `${origin}/login?error=Verifikasi+link+gagal+atau+sudah+kadaluwarsa.+Silakan+coba+lagi.`,
  );
}
