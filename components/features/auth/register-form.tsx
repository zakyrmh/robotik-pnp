"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { register } from "@/lib/actions/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  LockPasswordIcon,
  EyeIcon,
  ViewOffIcon,
  CheckmarkCircle01Icon,
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

export function RegisterForm() {
  const [state, action, isPending] = useActionState(register, null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const strength = getPasswordStrength(password);

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border border-border bg-card shadow-soft relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong" />

        <CardHeader className="gap-2 p-6 sm:p-8 pb-4">
          <CardTitle className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
            Portal Registrasi
          </CardTitle>
          <CardDescription className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Buat akun baru untuk mengakses sistem manajemen dan rekrutmen
            terbuka UKM Robotik PNP.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 p-6 sm:p-8 pt-0">
          {state?.error && (
            <Alert variant="destructive" className="rounded-lg">
              <HugeiconsIcon icon={AlertCircleIcon} />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

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
                <FieldLabel
                  htmlFor="password"
                  className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Password
                </FieldLabel>
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
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    className="h-full text-sm font-body text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={isPending}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 rounded-lg border border-border bg-secondary/60 p-2.5 flex flex-col gap-1.5 shadow-2xs">
                    <div className="flex h-1.5 gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                            strength.score >= i
                              ? strength.colorClass
                              : "bg-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">
                        Kekuatan kunci:
                      </span>
                      <span
                        className={`font-semibold ${strength.textColorClass}`}
                      >
                        {strength.text}
                      </span>
                    </div>
                  </div>
                )}
              </Field>

              <Field data-disabled={isPending}>
                <FieldLabel
                  htmlFor="confirmPassword"
                  className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Konfirmasi Password
                </FieldLabel>
                <InputGroup className="h-11 min-h-[44px] rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-2xs">
                  <InputGroupAddon>
                    <HugeiconsIcon
                      icon={LockPasswordIcon}
                      className="size-4 text-muted-foreground"
                    />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    className="h-full text-sm font-body text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={isPending}
                  />
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
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    data-icon="inline-start"
                  />
                  Daftar Sekarang
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center p-6 sm:p-8 pt-0 border-t border-border/60 mt-2">
          <p className="font-body text-xs sm:text-sm text-center text-muted-foreground">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline transition-colors"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="text-center text-xs font-body text-muted-foreground leading-relaxed px-2">
        Dengan mendaftar, Anda menyetujui{" "}
        <Link
          href="/terms"
          className="text-primary hover:underline font-medium"
        >
          Syarat Ketentuan
        </Link>{" "}
        &amp;{" "}
        <Link
          href="/privacy"
          className="text-primary hover:underline font-medium"
        >
          Kebijakan Privasi
        </Link>{" "}
        UKM Robotik PNP.
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: Record<
    number,
    { label: string; text: string; colorClass: string; textColorClass: string }
  > = {
    0: {
      label: "weak",
      text: "Sangat Lemah",
      colorClass: "bg-red-500",
      textColorClass: "text-red-500",
    },
    1: {
      label: "weak",
      text: "Lemah",
      colorClass: "bg-red-500",
      textColorClass: "text-red-500",
    },
    2: {
      label: "fair",
      text: "Cukup",
      colorClass: "bg-amber-500",
      textColorClass: "text-amber-500",
    },
    3: {
      label: "good",
      text: "Kuat",
      colorClass: "bg-emerald-500",
      textColorClass: "text-emerald-500",
    },
    4: {
      label: "strong",
      text: "Sangat Kuat",
      colorClass: "bg-emerald-600",
      textColorClass: "text-emerald-600",
    },
  };

  return { score, ...map[score] };
}
