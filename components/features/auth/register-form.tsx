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
    <div className="space-y-6">
      <Card className="border-hairline-dark bg-surface-card-dark rounded-none shadow-none">
        <CardHeader className="space-y-2">
          <Badge
            variant="outline"
            className="w-fit border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue uppercase font-mono tracking-[1.5px] text-[10px] rounded-sm pointer-events-none"
          >
            REGISTRATION SYSTEM // NEW RECRUIT
          </Badge>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight text-white font-sans">
            PORTAL DAFTAR
          </CardTitle>
          <CardDescription className="text-xs text-gray-400 font-sans font-light">
            Buat kredensial login baru untuk mengakses sistem manajemen UKM
            Robotik PNP.
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
                  placeholder="CONTOH@EMAIL.COM"
                  className="pl-10 h-12 bg-canvas-dark border-hairline-dark rounded-none text-white placeholder-gray-600 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyber-blue font-sans text-sm"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-mono text-xs uppercase tracking-[1.5px] text-gray-300"
              >
                PASSWORD
              </Label>
              <div className="relative">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="MINIMAL 8 KARAKTER"
                  className="pl-10 pr-10 h-12 bg-canvas-dark border-hairline-dark rounded-none text-white placeholder-gray-600 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyber-blue font-sans text-sm"
                  required
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffIcon : EyeIcon}
                    size={18}
                  />
                </button>
              </div>

              {password && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex h-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-none bg-hairline-dark transition-colors ${strength.score >= i ? (strength.label === "weak" ? "bg-crimson-red" : strength.label === "fair" ? "bg-tech-navy" : "bg-cyber-blue") : ""}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    KEKUATAN KUNCI:{" "}
                    <span
                      className={
                        strength.label === "weak"
                          ? "text-crimson-red"
                          : strength.label === "fair"
                            ? "text-tech-navy"
                            : "text-cyber-blue"
                      }
                    >
                      {strength.text}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="font-mono text-xs uppercase tracking-[1.5px] text-gray-300"
              >
                KONFIRMASI PASSWORD
              </Label>
              <div className="relative">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="ULANGI PASSWORD"
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

        <CardFooter className="flex flex-col border-t border-hairline-dark pt-6 text-center text-xs text-gray-400 font-sans font-light">
          <p>
            Sudah terdaftar?{" "}
            <Link
              href="/login"
              className="font-mono text-xs uppercase tracking-wider text-cyber-blue hover:text-tech-navy hover:underline transition-colors"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="text-center text-[10px] text-gray-500 font-mono uppercase tracking-wider">
        Dengan mendaftar, Anda menyetujui{" "}
        <Link
          href="/terms"
          className="text-cyber-blue hover:text-tech-navy hover:underline transition-colors"
        >
          Syarat Ketentuan
        </Link>{" "}
        &amp;{" "}
        <Link
          href="/privacy"
          className="text-cyber-blue hover:text-tech-navy hover:underline transition-colors"
        >
          Kebijakan Privasi
        </Link>
        .
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

  const map: Record<number, { label: string; text: string }> = {
    0: { label: "weak", text: "SANGAT LEMAH" },
    1: { label: "weak", text: "LEMAH" },
    2: { label: "fair", text: "CUKUP" },
    3: { label: "good", text: "KUAT" },
    4: { label: "strong", text: "SANGAT KUAT" },
  };

  return { score, ...map[score] };
}
