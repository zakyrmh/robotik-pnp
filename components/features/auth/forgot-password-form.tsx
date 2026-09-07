"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { forgotPassword } from "@/lib/actions/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  UserEdit01Icon,
  Login01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(forgotPassword, null);
  const [captchaToken, setCaptchaToken] = useState("");

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-2">
        <CardTitle className="font-display text-lg sm:text-xl font-semibold tracking-tight">
          Lupa Password
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Masukkan NIM dan alamat email yang terdaftar untuk mengatur ulang
          password akun Anda.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {state?.error && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="captchaToken" value={captchaToken} />

          <FieldGroup>
            <Field data-disabled={isPending}>
              <FieldLabel htmlFor="nim">Nomor Induk Mahasiswa (NIM)</FieldLabel>
              <InputGroup className="h-10 sm:h-11">
                <InputGroupAddon>
                  <HugeiconsIcon icon={UserEdit01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  id="nim"
                  name="nim"
                  type="text"
                  placeholder="230109..."
                  autoComplete="username"
                  className="h-full text-sm"
                  required
                  disabled={isPending}
                />
              </InputGroup>
            </Field>

            <Field data-disabled={isPending}>
              <FieldLabel htmlFor="email">Alamat Email</FieldLabel>
              <InputGroup className="h-10 sm:h-11">
                <InputGroupAddon>
                  <HugeiconsIcon icon={Mail01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="h-full text-sm"
                  required
                  disabled={isPending}
                />
              </InputGroup>
            </Field>
          </FieldGroup>

          {/* Cloudflare Turnstile Bot Protection Widget */}
          <div className="flex justify-center overflow-x-auto">
            <Turnstile
              siteKey={
                process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                "1x00000000000000000000AA"
              }
              onSuccess={(token: string) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 text-sm font-semibold"
            disabled={isPending || !captchaToken}
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Memproses...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Login01Icon} data-icon="inline-start" />
                Kirim Link Reset
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center px-5 sm:px-6">
        <p className="text-sm text-center text-muted-foreground">
          Ingat password Anda?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
          >
            Kembali ke Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
