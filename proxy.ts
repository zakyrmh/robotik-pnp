import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Fungsi ini bertindak sebagai gerbang utama Next.js Proxy (Middleware).
 * Setiap request yang lewat akan diproses oleh updateSession untuk mengecek
 * status login, konfirmasi email, dan status onboarding.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Konfigurasi Matcher:
 * Menentukan halaman mana saja yang akan dipantau oleh proxy.
 * Kita mengecualikan file statis agar tidak membebani performa.
 */
export const config = {
  matcher: [
    /*
     * Match semua path request kecuali yang dimulai dengan:
     * - _next/static (file statis Next.js)
     * - _next/image (optimasi gambar)
     * - favicon.ico (ikon browser)
     * - File publik (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
