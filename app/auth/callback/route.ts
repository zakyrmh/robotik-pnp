import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Route Handler: GET /auth/callback
 *
 * Menangani callback verifikasi email dari Supabase Auth.
 * Dipanggil ketika user mengklik link di email konfirmasi akun.
 *
 * Alur:
 * 1. Ambil `code` dari query parameter
 * 2. Tukar code dengan session menggunakan Supabase
 * 3. Jika berhasil → redirect ke halaman sukses /auth/verified
 * 4. Jika gagal   → redirect ke /login dengan pesan error
 *
 * Catatan: Route ini terpisah dari app/(auth)/callback/route.ts
 * yang menangani flow reset password (?next=/reset-password).
 * Route ini khusus untuk verifikasi email saat pendaftaran akun baru.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Verifikasi berhasil → tampilkan halaman sukses dengan countdown
      return NextResponse.redirect(`${origin}/auth/verified`)
    }
  }

  // Gagal: code tidak ada atau tidak valid → kembali ke login dengan error
  return NextResponse.redirect(
    `${origin}/login?error=Link+verifikasi+tidak+valid+atau+telah+kadaluarsa`
  )
}
