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
  Loading03Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(register, null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border border-border dark:border-white/10 bg-card text-card-foreground rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
        <CardHeader className="space-y-2.5 p-5 sm:p-6 pb-2 sm:pb-3">
          <Badge
            variant="outline"
            className="w-fit border-pnp-orange/30 bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange font-mono uppercase tracking-widest text-[10px] font-semibold rounded-full px-3 py-1 pointer-events-none"
          >
            REGISTRATION // CALON ANGGOTA
          </Badge>
          <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-display">
            PORTAL REGISTRASI
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground font-sans font-normal leading-relaxed">
            Buat akun baru untuk mengakses sistem manajemen dan rekrutmen
            terbuka UKM Robotik PNP.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-5 sm:p-6 pt-2 sm:pt-3">
          {state?.error && (
            <Alert
              variant="destructive"
              className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg flex items-center gap-2.5 p-3 sm:p-4"
            >
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={18}
                className="text-destructive shrink-0"
              />
              <AlertDescription className="font-mono text-xs font-medium uppercase tracking-wider">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          <form action={action} className="space-y-4">
            <input type="hidden" name="captchaToken" value={captchaToken} />

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="font-mono text-micro font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Alamat Email
              </Label>
              <div className="relative group">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-pnp-orange pointer-events-none"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-10 h-11 sm:h-12 bg-background border-input rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-pnp-orange focus:ring-2 focus:ring-pnp-orange/20 font-sans text-sm transition-all"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="font-mono text-micro font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative group">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-pnp-orange pointer-events-none"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  className="pl-10 pr-10 h-11 sm:h-12 bg-background border-input rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-pnp-orange focus:ring-2 focus:ring-pnp-orange/20 font-sans text-sm transition-all"
                  required
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffIcon : EyeIcon}
                    size={18}
                  />
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2.5 space-y-1.5 bg-muted/50 p-2.5 rounded-lg border border-border/50">
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
                  <div className="flex items-center justify-between text-micro font-mono">
                    <span className="text-muted-foreground uppercase tracking-wider">
                      Kekuatan Kunci:
                    </span>
                    <span
                      className={`font-semibold uppercase tracking-wider ${strength.textColorClass}`}
                    >
                      {strength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="font-mono text-micro font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Konfirmasi Password
              </Label>
              <div className="relative group">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-pnp-orange pointer-events-none"
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  className="pl-10 h-11 sm:h-12 bg-background border-input rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-pnp-orange focus:ring-2 focus:ring-pnp-orange/20 font-sans text-sm transition-all"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Cloudflare Turnstile Bot Protection Widget */}
            <div className="flex justify-center my-3 overflow-x-auto">
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
              className="w-full h-11 sm:h-12 bg-dongker-surface hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-orange-deep text-white font-sans font-semibold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-60"
              disabled={isPending || !captchaToken}
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="mr-2 h-4 w-4 animate-spin text-current"
                  />{" "}
                  MENDAFTARKAN...
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="mr-2 h-4 w-4 text-current"
                  />{" "}
                  DAFTAR SEKARANG
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-border pt-4 pb-5 text-center text-xs text-muted-foreground font-sans">
          <p>
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-pnp-orange hover:text-orange-deep dark:hover:text-orange-300 underline-offset-4 hover:underline transition-colors ml-1"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="text-center text-micro text-muted-foreground font-sans leading-relaxed px-2">
        Dengan mendaftar, Anda menyetujui{" "}
        <Link
          href="/terms"
          className="text-pnp-orange hover:underline font-medium"
        >
          Syarat Ketentuan
        </Link>{" "}
        &amp;{" "}
        <Link
          href="/privacy"
          className="text-pnp-orange hover:underline font-medium"
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
