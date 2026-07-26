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
    <div className="space-y-6">
      <Card className="border-hairline-dark bg-surface-card-dark rounded-none shadow-none">
        <CardHeader className="space-y-2 text-center sm:text-left">
          <Badge
            variant="outline"
            className="w-fit border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue uppercase font-mono tracking-[1.5px] text-[10px] rounded-sm pointer-events-none"
          >
            ACCOUNT RECOVERY
          </Badge>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight text-white font-sans">
            LUPA PASSWORD
          </CardTitle>
          <CardDescription className="text-xs text-gray-400 font-sans font-light">
            Masukkan NIM dan alamat email yang terdaftar untuk mengatur ulang
            password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state?.error && (
            <Alert
              variant="destructive"
              className="bg-crimson-red/10 border-crimson-red/30 text-crimson-red rounded-none flex items-center gap-2"
            >
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={18}
                className="text-crimson-red shrink-0"
              />
              <AlertDescription className="font-mono text-xs uppercase tracking-wider">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          <form action={action} className="space-y-4">
            <input type="hidden" name="captchaToken" value={captchaToken} />

            <div className="space-y-2">
              <Label
                htmlFor="nim"
                className="font-mono text-xs uppercase tracking-[1.5px] text-gray-300"
              >
                NOMOR INDUK MAHASISWA (NIM)
              </Label>
              <div className="relative">
                <HugeiconsIcon
                  icon={UserEdit01Icon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
                <Input
                  id="nim"
                  name="nim"
                  type="text"
                  placeholder="230109..."
                  className="pl-10 h-12 bg-canvas-dark border-hairline-dark rounded-none text-white placeholder-gray-600 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyber-blue font-sans text-sm uppercase"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-mono text-xs uppercase tracking-[1.5px] text-gray-300"
              >
                ALAMAT EMAIL
              </Label>
              <div className="relative">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="NAMA@EMAIL.COM"
                  className="pl-10 h-12 bg-canvas-dark border-hairline-dark rounded-none text-white placeholder-gray-600 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyber-blue font-sans text-sm"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Cloudflare Turnstile Bot Protection Widget */}
            <div className="flex justify-center my-4">
              <Turnstile
                siteKey={
                  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                  "1x00000000000000000000AA"
                }
                onSuccess={(token: string) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-black font-mono font-medium uppercase tracking-[1.5px] rounded-none border border-white hover:bg-transparent hover:text-white transition-none cursor-pointer"
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

        <CardFooter className="flex flex-col border-t border-hairline-dark pt-6 text-center text-xs text-gray-400 font-sans font-light">
          <p>
            Ingat password Anda?{" "}
            <Link
              href="/login"
              className="font-mono text-xs uppercase tracking-wider text-cyber-blue hover:text-tech-navy hover:underline transition-colors"
            >
              Kembali ke Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
