"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

import { BentoAuthLayout } from "@/components/auth/bento-auth-layout";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthForm } from "@/hooks/use-auth-form";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth.validation";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const { fieldErrors, globalError, isPending, handleSubmit, clearFieldError } =
    useAuthForm<typeof forgotPasswordSchema>({
      schema: forgotPasswordSchema,
      redirectTo: "", // Tidak redirect, tampilkan pesan sukses
      onSubmit: async (data: ForgotPasswordFormData, supabase) => {
        // url param redirect jika user mengeklik link di email untuk reset
        const { error } = await supabase.auth.resetPasswordForEmail(
          data.email,
          {
            redirectTo: `${window.location.origin}/callback?next=/reset-password`,
          },
        );
        if (!error) {
          setIsSuccess(true);
        }
        return { error };
      },
    });

  return (
    <BentoAuthLayout>
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email terdaftar untuk menerima tautan pembaruan password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center animate-in fade-in zoom-in-95">
              <div className="rounded-full bg-emerald-100 p-3">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Cek Email Anda</h3>
                <p className="text-sm text-muted-foreground">
                  Kami telah mengirimkan tautan reset password ke alamat email
                  Anda. Silakan ikuti instruksi di dalamnya.
                </p>
              </div>
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
                  fieldId="reset-email"
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                  error={fieldErrors.email}
                  onChange={() => clearFieldError("email")}
                />

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {isPending ? "Mengirim..." : "Kirim Link Reset"}
                </Button>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="mr-2 size-4" />
            Kembali ke Halaman Login
          </Link>
        </CardFooter>
      </Card>
    </BentoAuthLayout>
  );
}
