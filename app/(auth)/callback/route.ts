import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect ke dashboard (atau halaman yang diminta)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika ada error, redirect ke register dengan pesan error
  return NextResponse.redirect(`${origin}/register?error=Verifikasi+email+gagal.+Silahkan+coba+lagi.`)
}
