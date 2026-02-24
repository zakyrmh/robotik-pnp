'use client'

/**
 * Halaman Register — /register
 *
 * Menampilkan form pendaftaran anggota baru dengan layout Bento Grid.
 * Menggunakan:
 * - BentoAuthLayout untuk layout bento di sisi kiri
 * - AuthFormField untuk field input yang konsisten
 * - useAuthForm hook untuk validasi Zod dan integrasi Supabase
 *
 * Fitur:
 * - Validasi real-time per field dengan pesan Bahasa Indonesia
 * - Loading state dengan animasi di tombol submit
 * - Pesan error global dari Supabase
 * - Pesan sukses setelah registrasi berhasil
 * - Redirect ke halaman login dengan pesan konfirmasi email
 * - Fully responsive dari mobile hingga desktop
 */

import Link from 'next/link'
import { UserPlus, Loader2 } from 'lucide-react'

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
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'

export default function RegisterPage() {
  /** Hook yang mengelola state form, validasi, dan submit */
  const {
    fieldErrors,
    globalError,
    success,
    isPending,
    handleSubmit,
    clearFieldError,
  } = useAuthForm<typeof registerSchema>({
    schema: registerSchema,
    redirectTo: '/login?message=Cek email untuk konfirmasi akun',
    successMessage: 'Pendaftaran berhasil! Mengalihkan ke halaman login...',
    onSubmit: async (data: RegisterFormData, supabase) => {
      // Memanggil Supabase Auth untuk proses registrasi
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      return { error }
    },
  })

  return (
    <BentoAuthLayout>
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        {/* Header card: judul dan deskripsi */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Daftar Akun</CardTitle>
          <CardDescription>
            Buat akun baru untuk bergabung dengan UKM Robotik PNP
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Pesan sukses setelah registrasi berhasil */}
          {success && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-chart-2/30 bg-chart-2/10 px-4 py-3 text-sm text-chart-2 animate-in fade-in-0 slide-in-from-top-1 duration-200"
            >
              {success}
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

          {/* Form Register */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AuthFormField
              fieldId="register-fullname"
              name="full_name"
              label="Nama Lengkap"
              type="text"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              required
              error={fieldErrors.full_name}
              onChange={() => clearFieldError('full_name')}
            />

            <AuthFormField
              fieldId="register-email"
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
              fieldId="register-password"
              name="password"
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              minLength={6}
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
                <UserPlus className="size-4" />
              )}
              {isPending ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>
        </CardContent>

        {/* Footer: link ke halaman login */}
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </BentoAuthLayout>
  )
}