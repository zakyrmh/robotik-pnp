import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Jalankan proxy pada semua path kecuali:
     * - _next/static  (file statis Next.js)
     * - _next/image   (optimasi gambar Next.js)
     * - favicon.ico   (favicon)
     * - File dengan ekstensi umum (svg, png, jpg, dll)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
