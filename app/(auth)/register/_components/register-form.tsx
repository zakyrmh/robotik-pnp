"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerUser } from "@/lib/firebase/auth";
import Link from "next/link";

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    setError(null);

    const result = await registerUser({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });

    if (result.success) {
      toast.success("Registrasi berhasil! Mengalihkan...");
      // Redirect to dashboard as requested, or verification page if that was the intent.
      // User requested: "Redirect user menggunakan router.push('/dashboard') (atau halaman verifikasi yang sesuai)."
      // I will use /dashboard as the primary instruction example, or verification if preferred.
      // Given the previous code had /verification-pending, I'll switch to /dashboard as explicitly suggested in the prompt "Redirect user menggunakan router.push('/dashboard')".
      router.push("/dashboard");
    } else {
      const errMsg = result.error || "Gagal melakukan registrasi";
      setError(errMsg);
      toast.error(errMsg);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Daftar Akun
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Bergabung dengan UKM Robotik PNP
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Global Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-sm text-red-400 text-center font-medium">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name */}
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
              placeholder="Nama Lengkap Anda"
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm Password */}
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
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
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
              "Daftar"
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-300">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-500 hover:text-blue-400"
            >
              Login disini
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
