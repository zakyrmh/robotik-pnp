"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  updateUserEmail,
  updateUserPassword,
} from "@/lib/firebase/services/profile-service";

// =========================================================
// FORM SCHEMAS
// =========================================================

const emailFormSchema = z.object({
  newEmail: z.string().email("Format email tidak valid"),
  currentPassword: z.string().min(1, "Password wajib diisi"),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type EmailFormValues = z.infer<typeof emailFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// =========================================================
// PROPS
// =========================================================

interface AccountFormProps {
  currentEmail: string;
}

// =========================================================
// PASSWORD INPUT COMPONENT
// =========================================================

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    name: string;
    ref: React.Ref<HTMLInputElement>;
  };
  required?: boolean;
}

function PasswordInput({
  id,
  label,
  placeholder,
  error,
  inputProps,
  required,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="pr-10"
          {...inputProps}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-slate-400" />
          ) : (
            <Eye className="h-4 w-4 text-slate-400" />
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// =========================================================
// EMAIL FORM COMPONENT
// =========================================================

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
  });

  const onSubmit = async (values: EmailFormValues) => {
    if (values.newEmail === currentEmail) {
      toast.error("Email baru tidak boleh sama dengan email saat ini");
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, error, requiresVerification } = await updateUserEmail({
        newEmail: values.newEmail,
        currentPassword: values.currentPassword,
      });

      if (success && requiresVerification) {
        setShowVerificationAlert(true);
        form.reset();
        toast.success("Email verifikasi telah dikirim");
      } else if (error) {
        toast.error(error);
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("Terjadi kesalahan saat mengubah email");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Ubah Email
          </h3>
          <p className="text-sm text-muted-foreground">
            Email saat ini: <span className="font-medium">{currentEmail}</span>
          </p>
        </div>
      </div>

      {showVerificationAlert && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Email verifikasi telah dikirim
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Silakan periksa inbox email baru Anda dan klik link verifikasi
              untuk menyelesaikan perubahan email. Email akan berubah setelah
              Anda memverifikasi.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newEmail">
            Email Baru <span className="text-red-500">*</span>
          </Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="Masukkan email baru"
            {...form.register("newEmail")}
          />
          {form.formState.errors.newEmail && (
            <p className="text-sm text-red-500">
              {form.formState.errors.newEmail.message}
            </p>
          )}
        </div>

        <PasswordInput
          id="emailCurrentPassword"
          label="Password Saat Ini"
          placeholder="Masukkan password untuk verifikasi"
          error={form.formState.errors.currentPassword?.message}
          inputProps={form.register("currentPassword")}
          required
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>Untuk keamanan, Anda harus memasukkan password saat ini.</span>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kirim Email Verifikasi
        </Button>
      </form>
    </div>
  );
}

// =========================================================
// PASSWORD FORM COMPONENT
// =========================================================

function PasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const { success, error } = await updateUserPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (success) {
        toast.success("Password berhasil diubah");
        form.reset();
      } else {
        toast.error(error || "Gagal mengubah password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Terjadi kesalahan saat mengubah password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Ubah Password
          </h3>
          <p className="text-sm text-muted-foreground">
            Pastikan menggunakan password yang kuat dan unik
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Tips Password Aman
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
            <li>Gunakan minimal 8 karakter</li>
            <li>Kombinasi huruf besar, huruf kecil, angka, dan simbol</li>
            <li>Jangan gunakan informasi pribadi yang mudah ditebak</li>
          </ul>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          id="currentPassword"
          label="Password Saat Ini"
          placeholder="Masukkan password saat ini"
          error={form.formState.errors.currentPassword?.message}
          inputProps={form.register("currentPassword")}
          required
        />

        <PasswordInput
          id="newPassword"
          label="Password Baru"
          placeholder="Masukkan password baru"
          error={form.formState.errors.newPassword?.message}
          inputProps={form.register("newPassword")}
          required
        />

        <PasswordInput
          id="confirmPassword"
          label="Konfirmasi Password Baru"
          placeholder="Ulangi password baru"
          error={form.formState.errors.confirmPassword?.message}
          inputProps={form.register("confirmPassword")}
          required
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ubah Password
        </Button>
      </form>
    </div>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function AccountForm({ currentEmail }: AccountFormProps) {
  return (
    <div className="space-y-8">
      <EmailForm currentEmail={currentEmail} />

      <Separator className="my-8" />

      <PasswordForm />
    </div>
  );
}

// =========================================================
// SKELETON COMPONENT
// =========================================================

export function AccountFormSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Email Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <Separator />

      {/* Password Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </div>
  );
}
