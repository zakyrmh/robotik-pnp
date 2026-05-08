"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
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

// Diasumsikan komponen UI sudah terpasang di @/components/ui
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

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1">
          <Badge
            variant="outline"
            className="w-fit border-indigo-500/30 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors uppercase tracking-widest text-[10px]"
          >
            Mulai Sekarang
          </Badge>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Buat Akun Baru
          </CardTitle>
          <CardDescription>
            Daftarkan diri Anda ke sistem UKM Robotik PNP
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state?.error && (
            <Alert variant="destructive" className="bg-destructive/10">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <div className="relative">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contoh@email.com"
                  className="pl-10"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  className="pl-10 pr-10"
                  required
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        className={`h-full flex-1 rounded-full bg-muted transition-colors ${strength.score >= i ? (strength.label === "weak" ? "bg-red-500" : strength.label === "fair" ? "bg-yellow-500" : "bg-emerald-500") : ""}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {strength.text}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  className="pl-10"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="mr-2 h-4 w-4 animate-spin"
                  />{" "}
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="mr-2 h-4 w-4"
                  />{" "}
                  Daftar Sekarang
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          <p>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-500 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Dengan mendaftar, Anda menyetujui{" "}
        <Link href="/terms" className="underline hover:text-indigo-400">
          Syarat
        </Link>{" "}
        &{" "}
        <Link href="/privacy" className="underline hover:text-indigo-400">
          Privasi
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
    0: { label: "weak", text: "Sangat Lemah" },
    1: { label: "weak", text: "Lemah" },
    2: { label: "fair", text: "Cukup" },
    3: { label: "good", text: "Kuat" },
    4: { label: "strong", text: "Sangat Kuat" },
  };

  return { score, ...map[score] };
}
