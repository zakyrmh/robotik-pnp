"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmRecoveryAction } from "@/lib/actions/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
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
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConfirmResetButtonProps {
  tokenHash: string;
  type: "recovery";
  next: string;
  isValid: boolean;
}

/**
 * Tombol konfirmasi pada halaman perantara `/reset-password`.
 *
 * Token hanya ditukar menjadi sesi ketika user menekan tombol ini — mencegah
 * email prefetcher mengonsumsi token sekali-pakai (lihat `reset-password/page.tsx`).
 */
export function ConfirmResetButton({
  tokenHash,
  type,
  next,
  isValid,
}: ConfirmResetButtonProps) {
  const [state, action, isPending] = useActionState(
    confirmRecoveryAction,
    null,
  );

  if (!isValid) {
    return (
      <Card className="rounded-lg text-center">
        <CardHeader className="gap-3">
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} size={32} />
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="font-display text-lg sm:text-xl font-semibold tracking-tight">
              Link Tidak Valid
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Link reset password tidak lengkap atau rusak. Silakan minta link
              baru untuk melanjutkan.
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="justify-center px-5 sm:px-6">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline transition-colors"
          >
            Minta Link Reset Password Baru
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg text-center">
      <CardHeader className="gap-3">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <HugeiconsIcon icon={Shield01Icon} size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="font-display text-lg sm:text-xl font-semibold tracking-tight">
            Konfirmasi Reset Password
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Klik tombol di bawah untuk melanjutkan ke halaman pembuatan password
            baru. Demi keamanan, kami tidak memverifikasi link Anda secara
            otomatis.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {state?.error && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />

          <Button
            type="submit"
            className="w-full h-10 sm:h-11 text-sm font-semibold"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Memverifikasi...
              </>
            ) : (
              <>
                Lanjutkan Reset Password
                <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
              </>
            )}
          </Button>
        </form>

        <p className="rounded-lg bg-muted/40 p-3.5 sm:p-4 text-left text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Demi keamanan, link reset password berlaku terbatas (berdasarkan
          waktu). Jika sudah kedaluwarsa, minta link baru.
        </p>
      </CardContent>

      <CardFooter className="justify-center px-5 sm:px-6">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline transition-colors"
        >
          Kembali ke Lupa Password
        </Link>
      </CardFooter>
    </Card>
  );
}
