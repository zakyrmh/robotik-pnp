"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { RegisterSchema, RegisterValues } from "@/schemas/auth";
import { callRegisterUser } from "@/lib/firebase/services/cloud-functions";
import { toast } from "sonner";

import Link from "next/link";
import { RecruitmentSettings } from "@/schemas/recruitment-settings";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface RegisterFormProps {
  settings: RecruitmentSettings | null;
}

export default function RegisterForm({ settings }: RegisterFormProps) {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: RegisterValues) => {
    setGlobalError(null);

    try {
      // 1. Panggil Cloud Function (Atomic Registration)
      const result = await callRegisterUser(data);

      if (!result.success || !result.data?.customToken) {
        throw new Error(result.error || "Registrasi gagal.");
      }

      // 2. Login menggunakan Custom Token yang dikembalikan server
      // Ini aman karena token valid dan user baru saja dibuat via server
      const { signInWithCustomToken, sendEmailVerification, getAuth } =
        await import("firebase/auth");
      const { app } = await import("@/lib/firebase/config");
      const auth = getAuth(app);

      const userCredential = await signInWithCustomToken(
        auth,
        result.data.customToken,
      );

      // 3. Trigger pengiriman email verifikasi dari Client SDK
      // (Memanfaatkan template email Auth Firebase yang gratis & reliable)
      await sendEmailVerification(userCredential.user);

      toast.success(
        "Akun berhasil dibuat. Silakan cek email Anda untuk verifikasi.",
      );
      router.push("/verify-email");
    } catch (error: unknown) {
      console.error("Registration error:", error);
      let errorMessage = "Terjadi kesalahan saat registrasi.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      setGlobalError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Buat Akun Baru
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Bergabung dengan Robotik PNP
        </p>

        {settings && (
          <div className="mt-3 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 py-1.5 px-3 rounded-full inline-block">
            Pendaftaran ditutup:{" "}
            {format(settings.schedule.closeDate, "dd MMMM yyyy", {
              locale: localeId,
            })}
          </div>
        )}
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Global Error Alert */}
        {globalError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-sm text-red-400 text-center font-medium">
              {globalError}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name Field */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Nama Lengkap
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Nama Lengkap"
              className={`appearance-none relative block w-full px-4 py-3 border ${
                errors.fullName ? "border-red-500" : "border-gray-600"
              } bg-gray-800/50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm`}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-400">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              className={`appearance-none relative block w-full px-4 py-3 border ${
                errors.email ? "border-red-500" : "border-gray-600"
              } bg-gray-800/50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm`}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`appearance-none relative block w-full px-4 py-3 border ${
                errors.password ? "border-red-500" : "border-gray-600"
              } bg-gray-800/50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm`}
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`appearance-none relative block w-full px-4 py-3 border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-600"
              } bg-gray-800/50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Register"
            )}
          </button>
        </div>

        <div className="text-center text-sm text-gray-400">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-500 hover:text-blue-400"
          >
            Login disini
          </Link>
        </div>
      </form>
    </div>
  );
}
