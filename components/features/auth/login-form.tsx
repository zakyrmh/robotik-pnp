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
    <Card className="rounded-2xl border border-border bg-card shadow-soft relative overflow-hidden">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong" />

      <CardHeader className="gap-2 p-6 sm:p-8 pb-4">
        <CardTitle className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
          Portal Login
        </CardTitle>
        <CardDescription className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Masukkan alamat email dan kata sandi Anda untuk mengakses sistem
          manajemen UKM Robotik PNP.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 p-6 sm:p-8 pt-0">
        {state?.error && (
          <Alert variant="destructive" className="rounded-lg">
            <HugeiconsIcon icon={AlertCircleIcon} />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Suspense fallback={null}>
          <LoginMessage />
        </Suspense>

        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="captchaToken" value={captchaToken} />

          <FieldGroup className="gap-4">
            <Field data-disabled={isPending}>
              <FieldLabel
                htmlFor="email"
                className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Alamat Email
              </FieldLabel>
              <InputGroup className="h-11 min-h-[44px] rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-2xs">
                <InputGroupAddon>
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    className="size-4 text-muted-foreground"
                  />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="h-full text-sm font-body text-foreground placeholder:text-muted-foreground"
                  required
                  disabled={isPending}
                />
              </InputGroup>
            </Field>

            <Field data-disabled={isPending}>
              <div className="flex w-full items-center justify-between gap-2">
                <FieldLabel
                  htmlFor="password"
                  className="w-auto font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Password
                </FieldLabel>
                <Link
                  href="/forgot-password"
                  className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline transition-colors"
                >
                  Lupa password?
                </Link>
              </div>
              <InputGroup className="h-11 min-h-[44px] rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-2xs">
                <InputGroupAddon>
                  <HugeiconsIcon
                    icon={LockPasswordIcon}
                    className="size-4 text-muted-foreground"
                  />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-full text-sm font-body text-foreground placeholder:text-muted-foreground"
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
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <HugeiconsIcon
                      icon={showPassword ? ViewOffIcon : EyeIcon}
                      className="size-4"
                    />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>

          {/* Cloudflare Turnstile Bot Protection Widget */}
          <div className="flex justify-center overflow-x-auto py-1">
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
            className="w-full h-11 min-h-[44px] text-sm font-semibold rounded-lg shadow-xs hover:shadow-soft active:scale-[0.98] transition-all cursor-pointer"
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

      <CardFooter className="justify-center p-6 sm:p-8 pt-0 border-t border-border/60 mt-2">
        <p className="font-body text-xs sm:text-sm text-center text-muted-foreground">
          Belum terdaftar?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline transition-colors"
          >
            Daftar Akun Baru
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
