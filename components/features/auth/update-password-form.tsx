"use client";

import { useActionState, useState } from "react";
import { updatePassword } from "@/lib/actions/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LockPasswordIcon,
  EyeIcon,
  ViewOffIcon,
  SaveIcon,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UpdatePasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border border-border dark:border-white/10 bg-card text-card-foreground rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
        <CardHeader className="space-y-2.5 p-5 sm:p-6 pb-2 sm:pb-3 text-left">
          <Badge
            variant="outline"
            className="w-fit border-pnp-orange/30 bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange font-mono uppercase tracking-widest text-[10px] font-semibold rounded-full px-3 py-1 pointer-events-none"
          >
            SYSTEM RECOVERY // NEW CREDENTIALS
          </Badge>
          <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-display">
            PERBARUI PASSWORD
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground font-sans font-normal leading-relaxed">
            Masukkan password baru Anda (minimal 8 karakter).
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
            {/* Password Baru Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password Baru
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
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 sm:h-12 bg-background border-input rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-pnp-orange focus:ring-2 focus:ring-pnp-orange/20 font-sans text-sm transition-all"
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffIcon : EyeIcon}
                    size={18}
                  />
                </button>
              </div>
            </div>

            {/* Konfirmasi Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 sm:h-12 bg-background border-input rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-pnp-orange focus:ring-2 focus:ring-pnp-orange/20 font-sans text-sm transition-all"
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <HugeiconsIcon
                    icon={showConfirmPassword ? ViewOffIcon : EyeIcon}
                    size={18}
                  />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-pnp-orange dark:hover:bg-orange-deep text-white font-sans font-semibold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-60 mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="mr-2 h-4 w-4 animate-spin text-current"
                  />{" "}
                  MENYIMPAN...
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={SaveIcon}
                    className="mr-2 h-4 w-4 text-current"
                  />{" "}
                  SIMPAN PASSWORD
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
