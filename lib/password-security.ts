import "server-only";

/**
 * lib/password-security.ts
 *
 * Workaround untuk Supabase Free Plan: fitur "Leaked Password Protection"
 * bawaan Supabase (HaveIBeenPwned check) hanya tersedia di Pro Plan ke atas.
 * File ini mereplikasi pengecekan yang sama di sisi aplikasi (Next.js),
 * menggunakan HaveIBeenPwned Pwned Passwords API dengan skema k-anonymity —
 * password ASLI tidak pernah dikirim ke pihak ketiga, hanya 5 karakter
 * pertama dari hash SHA-1-nya.
 *
 * Referensi resmi Supabase (yang jadi acuan implementasi ini):
 * https://supabase.com/docs/guides/auth/password-security
 */

const HIBP_RANGE_API = "https://api.pwnedpasswords.com/range/";

/**
 * Menghitung SHA-1 hash dari string menggunakan Web Crypto API
 * (tersedia di Node.js 18+ dan Edge Runtime, cocok untuk App Router).
 */
async function sha1Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export interface PwnedCheckResult {
  isPwned: boolean;
  /** Berapa kali password ini muncul di data breach yang diketahui HIBP */
  occurrences: number;
}

/**
 * Mengecek apakah sebuah password pernah muncul di data breach
 * menurut database HaveIBeenPwned (Pwned Passwords).
 *
 * Cara kerja (k-anonymity, sama seperti yang dipakai Supabase Pro):
 * 1. Hash password dengan SHA-1.
 * 2. Kirim hanya 5 karakter pertama hash ke API HIBP.
 * 3. API mengembalikan daftar suffix hash yang berbagi prefix tsb.
 * 4. Cocokkan suffix secara lokal — password asli tidak pernah terkirim.
 *
 * @throws Error jika API HIBP tidak bisa diakses (mis. offline / rate limit).
 *         Sebaiknya di-catch dan fallback ke "allow" agar signup tidak
 *         terblokir total hanya karena HIBP sedang down (fail-open),
 *         TAPI tetap log kejadian ini untuk dipantau.
 */
export async function checkPasswordPwned(
  password: string,
): Promise<PwnedCheckResult> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`${HIBP_RANGE_API}${prefix}`, {
    method: "GET",
    headers: {
      "Add-Padding": "true", // mitigasi response-size side channel, sesuai rekomendasi HIBP
    },
    // Jangan cache respons ini — data breach terus bertambah
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`HIBP API error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const lines = text.split("\r\n");

  for (const line of lines) {
    const [hashSuffix, count] = line.split(":");
    if (hashSuffix === suffix) {
      return { isPwned: true, occurrences: parseInt(count, 10) || 0 };
    }
  }

  return { isPwned: false, occurrences: 0 };
}

/**
 * Aturan kekuatan password minimum (samakan dengan yang di-set
 * di Dashboard Supabase: Authentication -> Policies -> Password Requirements,
 * agar tidak ada celah antara validasi frontend dan aturan project).
 *
 * Required: lowercase + uppercase + digits + symbols, min 8 karakter.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Password minimal 8 karakter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password harus mengandung huruf kecil.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password harus mengandung huruf besar.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password harus mengandung angka.";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password harus mengandung simbol (contoh: !@#$%^&*).";
  }
  return null;
}
