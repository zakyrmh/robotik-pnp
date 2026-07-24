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

export default function UpdatePasswordPage() {
  const [state, action, isPending] = useActionState(updatePassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-hairline-dark bg-surface-card-dark rounded-none shadow-none">
        <CardHeader className="space-y-2 text-center sm:text-left">
          <Badge
            variant="outline"
            className="w-fit border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue uppercase font-mono tracking-[1.5px] text-[10px] rounded-sm pointer-events-none"
          >
            SYSTEM RECOVERY // NEW CREDENTIALS
          </Badge>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight text-white font-sans">
            PERBARUI PASSWORD
          </CardTitle>
          <CardDescription className="text-xs text-gray-400 font-sans font-light">
            Masukkan password baru Anda (minimal 8 karakter).
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
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-mono text-xs uppercase tracking-[1.5px] text-gray-300"
              >
                PASSWORD BARU
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
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-canvas-dark border-hairline-dark rounded-none text-white placeholder-gray-600 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyber-blue font-sans text-sm"
                  required
                  disabled={isPending}
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-canvas-dark border-hairline-dark rounded-none text-white placeholder-gray-600 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyber-blue font-sans text-sm"
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={showConfirmPassword ? ViewOffIcon : EyeIcon}
                    size={18}
                  />
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-cyber-blue text-white font-mono font-medium uppercase tracking-[1.5px] rounded-none hover:bg-tech-navy transition-colors cursor-pointer mt-2"
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
