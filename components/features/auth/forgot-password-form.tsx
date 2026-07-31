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

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(forgotPassword, null);
  const [captchaToken, setCaptchaToken] = useState("");

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border border-border dark:border-white/10 bg-card text-card-foreground rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
        <CardHeader className="space-y-2.5 p-5 sm:p-6 pb-2 sm:pb-3 text-left">
          <Badge
            variant="outline"
            className="w-fit border-pnp-orange/30 bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange font-mono uppercase tracking-widest text-[10px] font-semibold rounded-full px-3 py-1 pointer-events-none"
          >
            ACCOUNT RECOVERY
          </Badge>
          <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-display">
            LUPA PASSWORD
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground font-sans font-normal leading-relaxed">
            Masukkan NIM dan alamat email yang terdaftar untuk mengatur ulang password akun Anda.
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

            {/* NIM Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="nim"
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Nomor Induk Mahasiswa (NIM)
              </Label>
              <div className="relative group">
                <HugeiconsIcon
                  icon={UserEdit01Icon}
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-pnp-orange pointer-events-none"
                />
                <Input
                  id="nim"
                  name="nim"
                  type="text"
                  placeholder="230109..."
                  className="pl-10 h-11 sm:h-12 bg-background border-input rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-pnp-orange focus:ring-2 focus:ring-pnp-orange/20 font-sans text-sm uppercase transition-all"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
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

            {/* Cloudflare Turnstile Bot Protection Widget */}
            <div className="flex justify-center my-3 overflow-x-auto">
              <Turnstile
                siteKey={
                  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                  "1x00000000000000000000AA"
                }
                onSuccess={(token: string) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-pnp-orange dark:hover:bg-orange-deep text-white font-sans font-semibold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-60"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="mr-2 h-4 w-4 animate-spin text-current"
                  />{" "}
                  MEMPROSES...
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={Login01Icon}
                    className="mr-2 h-4 w-4 text-current"
                  />{" "}
                  KIRIM LINK RESET
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-border pt-4 pb-5 text-center text-xs text-muted-foreground font-sans">
          <p>
            Ingat password Anda?{" "}
            <Link
              href="/login"
              className="font-semibold text-pnp-orange hover:text-orange-deep dark:hover:text-orange-300 underline-offset-4 hover:underline transition-colors ml-1"
            >
              Kembali ke Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
