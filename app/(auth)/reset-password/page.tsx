'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

import { BentoAuthLayout } from '@/components/auth/bento-auth-layout'
import { AuthFormField } from '@/components/auth/auth-form-field'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthForm } from '@/hooks/use-auth-form'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth'

export default function ResetPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    fieldErrors,
    globalError,
    isPending,
    handleSubmit,
    clearFieldError,
  } = useAuthForm<typeof resetPasswordSchema>({
    schema: resetPasswordSchema,
    redirectTo: '', // Handle redirect/success locally
    onSubmit: async (data: ResetPasswordFormData, supabase) => {
      // Supabase OAuth Auth Flow: user will be authenticated automatically 
      // when they reach this page via the callback link click.
      // So we can directly update their password now.
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })
      if (!error) {
        setIsSuccess(true)
      }
      return { error }
    },
  })

  return (
    <BentoAuthLayout>
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Buat Password Baru</CardTitle>
          <CardDescription>
            Silakan masukkan password baru untuk akun Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center animate-in fade-in zoom-in-95">
              <div className="rounded-full bg-emerald-100 p-3">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Password Berhasil Diubah!</h3>
                <p className="text-sm text-muted-foreground">
                  Akun Anda kini telah diamankan dengan password baru. Anda dapat melanjutkan mengakses sistem.
                </p>
              </div>
              <Button asChild className="mt-4 w-full cursor-pointer">
                <Link href="/dashboard">
                  Lanjutkan ke Dashboard <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {globalError && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 duration-200"
                >
                  {globalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AuthFormField
                  fieldId="reset-password"
                  name="password"
                  label="Password Baru"
                  type="password"
                  placeholder="Masukkan password baru"
                  required
                  error={fieldErrors.password}
                  onChange={() => clearFieldError('password')}
                />

                <AuthFormField
                  fieldId="reset-confirm-password"
                  name="confirmPassword"
                  label="Konfirmasi Password Baru"
                  type="password"
                  placeholder="Ketik ulang password baru"
                  required
                  error={fieldErrors.confirmPassword}
                  onChange={() => clearFieldError('confirmPassword')}
                />

                <Button
                  type="submit"
                  className="w-full cursor-pointer mt-2"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </BentoAuthLayout>
  )
}
