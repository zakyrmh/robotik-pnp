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
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

export function UpdatePasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-2">
        <CardTitle className="font-display text-lg sm:text-xl font-semibold tracking-tight">
          Perbarui Password
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Masukkan password baru Anda (minimal 8 karakter).
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {state?.error && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={action} className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-disabled={isPending}>
              <FieldLabel htmlFor="password">Password Baru</FieldLabel>
              <InputGroup className="h-10 sm:h-11">
                <InputGroupAddon>
                  <HugeiconsIcon icon={LockPasswordIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-full text-sm"
                  required
                  disabled={isPending}
                />
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mr-1"
                  tabIndex={-1}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <HugeiconsIcon icon={showPassword ? ViewOffIcon : EyeIcon} />
                </InputGroupButton>
              </InputGroup>
            </Field>

            <Field data-disabled={isPending}>
              <FieldLabel htmlFor="confirmPassword">
                Konfirmasi Password
              </FieldLabel>
              <InputGroup className="h-10 sm:h-11">
                <InputGroupAddon>
                  <HugeiconsIcon icon={LockPasswordIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-full text-sm"
                  required
                  disabled={isPending}
                />
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mr-1"
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <HugeiconsIcon
                    icon={showConfirmPassword ? ViewOffIcon : EyeIcon}
                  />
                </InputGroupButton>
              </InputGroup>
            </Field>
          </FieldGroup>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 text-sm font-semibold"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Menyimpan...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={SaveIcon} data-icon="inline-start" />
                Simpan Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
