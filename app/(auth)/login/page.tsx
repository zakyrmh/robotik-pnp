"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  LockPasswordIcon,
  EyeIcon,
  ViewOffIcon,
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

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1 text-center sm:text-left">
          <Badge
            variant="outline"
            className="w-fit border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors uppercase tracking-widest text-[10px]"
          >
            Selamat Datang Kembali
          </Badge>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Masuk ke Akun
          </CardTitle>
          <CardDescription>
            Gunakan kredensial Anda untuk mengakses sistem
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
                  placeholder="nama@email.com"
                  className="pl-10 h-11 bg-muted/20"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-500 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-muted/20"
                  required
                  disabled={isPending}
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
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-linear-to-r from-indigo-600 to-purple-600 font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all active:scale-[0.98]"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="mr-2 h-4 w-4 animate-spin"
                  />{" "}
                  Menyambungkan...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Login01Icon} className="mr-2 h-4 w-4" />{" "}
                  Masuk Sekarang
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          <p>
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-500 hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
