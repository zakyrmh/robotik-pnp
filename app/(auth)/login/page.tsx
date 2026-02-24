'use client'

/**
 * Halaman Login — /login
 *
 * Menampilkan form login dengan layout Bento Grid yang responsif.
 * Menggunakan:
 * - BentoAuthLayout untuk layout bento di sisi kiri
 * - AuthFormField untuk field input yang konsisten
 * - useAuthForm hook untuk validasi Zod dan integrasi Supabase
 *
 * Fitur:
 * - Validasi real-time per field dengan pesan Bahasa Indonesia
 * - Loading state dengan animasi di tombol submit
 * - Pesan error global dari Supabase
 * - Notifikasi sukses (misal: setelah register berhasil)
 * - Fully responsive dari mobile hingga desktop
 *
 * Catatan: useSearchParams harus dibungkus Suspense Boundary (Next.js 16+)
 */

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Loader2 } from 'lucide-react'

import { BentoAuthLayout } from '@/components/auth/bento-auth-layout'
import { AuthFormField } from '@/components/auth/auth-form-field'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthForm } from '@/hooks/use-auth-form'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'

/**
 * Komponen utama form login — dipisah agar bisa dibungkus Suspense.
 * useSearchParams memerlukan Suspense Boundary di Next.js 16+.
 */
function LoginForm() {
  /** Mengambil query parameter (contoh: ?message=...) */
  const searchParams = useSearchParams()
  const messageParam = searchParams.get('message')

  /** Hook yang mengelola state form, validasi, dan submit */
  const {
    fieldErrors,
    globalError,
    isPending,
    handleSubmit,
    clearFieldError,
  } = useAuthForm<typeof loginSchema>({
    schema: loginSchema,
    redirectTo: '/dashboard',
    onSubmit: async (data: LoginFormData, supabase) => {
      // Memanggil Supabase Auth untuk proses login
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      return { error }
    },
  })

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      {/* Header card: judul dan deskripsi */}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
        <CardDescription>
          Masuk ke akun Anda untuk mengakses sistem informasi
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Notifikasi dari halaman lain (contoh: redirect dari register) */}
        {messageParam && (
          <div className="mb-4 rounded-lg border border-chart-2/30 bg-chart-2/10 px-4 py-3 text-sm text-chart-2">
            {messageParam}
          </div>
        )}

        {/* Pesan error global dari Supabase */}
        {globalError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 duration-200"
          >
            {globalError}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthFormField
            fieldId="login-email"
            name="email"
            label="Email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            required
            error={fieldErrors.email}
            onChange={() => clearFieldError('email')}
          />

          <AuthFormField
            fieldId="login-password"
            name="password"
            label="Password"
            type="password"
            placeholder="Masukkan password"
            autoComplete="current-password"
            required
            error={fieldErrors.password}
            onChange={() => clearFieldError('password')}
          />

          {/* Tombol submit dengan loading state */}
          <Button
            type="submit"
            className="w-full cursor-pointer"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {isPending ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </CardContent>

      {/* Footer: link ke halaman register */}
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

/**
 * Komponen fallback saat Suspense menunggu useSearchParams.
 * Menampilkan skeleton loading yang sesuai dengan layout form.
 */
function LoginSkeleton() {
  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center">
        <div className="mx-auto h-7 w-24 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded-md bg-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  )
}

/**
 * Komponen halaman login yang diekspor sebagai default.
 * Membungkus LoginForm dengan Suspense untuk mendukung useSearchParams.
 */
export default function LoginPage() {
  return (
    <BentoAuthLayout>
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </BentoAuthLayout>
  )
}