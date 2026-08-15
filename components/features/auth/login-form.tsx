"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { login } from "@/lib/actions/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  LockPasswordIcon,
  EyeIcon,
  ViewOffIcon,
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
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginMessage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  if (!message) return null;

  return (
    <Alert className="bg-accent text-accent-foreground border-border/50">
      <HugeiconsIcon icon={AlertCircleIcon} />
      <AlertDescription className="text-accent-foreground">
        {message}
      </AlertDescription>
    </Alert>
  );
}

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-2">
        <CardTitle className="font-display text-lg sm:text-xl font-semibold tracking-tight">
          Portal Login
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Masukkan alamat email dan kata sandi Anda untuk mengakses sistem
          manajemen UKM Robotik PNP.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {state?.error && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Suspense fallback={null}>
          <LoginMessage />
        </Suspense>

        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="captchaToken" value={captchaToken} />

          <FieldGroup>
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

            <Field data-disabled={isPending}>
              <div className="flex w-full items-center justify-between gap-2">
                <FieldLabel htmlFor="password" className="w-auto">
                  Password
                </FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline transition-colors"
                >
                  Lupa password?
                </Link>
              </div>
              <InputGroup className="h-10 sm:h-11">
                <InputGroupAddon>
                  <HugeiconsIcon icon={LockPasswordIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-full text-sm"
                  required
                  disabled={isPending}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-sm"
                    variant="ghost"
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    <HugeiconsIcon
                      icon={showPassword ? ViewOffIcon : EyeIcon}
                    />
                  </InputGroupButton>
                </InputGroupAddon>
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
                Masuk Portal
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center px-5 sm:px-6">
        <p className="text-sm text-center text-muted-foreground">
          Belum terdaftar?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
          >
            Daftar Akun Baru
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
