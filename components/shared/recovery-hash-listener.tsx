"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * RecoveryHashListener
 *
 * Menangani redirect otomatis ke halaman /update-password setelah user
 * mengklik link reset password dari email.
 *
 * Supabase Auth mengirimkan recovery token sebagai hash fragment di URL:
 *   https://domain.com/#access_token=...&type=recovery
 *
 * createBrowserClient (@supabase/ssr) secara otomatis mendeteksi hash ini,
 * memproses token, menyimpan session ke cookie, lalu menghapus hash dari URL
 * — semuanya terjadi sebelum React hydration selesai.
 *
 * Solusi:
 * 1. Inline <script> di <head> (layout.tsx) menangkap flag `type=recovery`
 *    dari hash secara sinkron sebelum React/Supabase client diinisialisasi,
 *    dan menyimpannya ke sessionStorage.
 * 2. Komponen ini mengecek flag tersebut, lalu mendengarkan onAuthStateChange
 *    untuk event PASSWORD_RECOVERY atau SIGNED_IN, dan melakukan redirect
 *    ke /update-password setelah session ter-set.
 */
export function RecoveryHashListener() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isRecovery =
      sessionStorage.getItem("supabase_recovery_redirect") === "true";
    if (!isRecovery) return;

    sessionStorage.removeItem("supabase_recovery_redirect");

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION") &&
        session
      ) {
        subscription.unsubscribe();
        router.push("/update-password");
        router.refresh();
      }
    });

    const timeout = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        subscription.unsubscribe();
        router.push("/update-password");
        router.refresh();
      }
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
