"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { registerUser } from "@/lib/firebase/auth";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      toast.success("Registrasi berhasil! Silakan cek email Anda.");
      router.push("/verification-pending");
    } else {
      const errMsg = result.error || "Gagal melakukan registrasi";
      setError(errMsg);
      toast.error(errMsg);
      setIsLoading(false);
    }
  }

  // Styles reused from LoginForm logic
  const inputContainerClass = "relative";
  const iconClass =
    "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500";
  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-white/5 dark:bg-gray-700/30 border border-white/20 dark:border-gray-600/50 rounded-lg text-white dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200";
  const labelClass =
    "block text-sm font-medium text-gray-200 dark:text-gray-300 mb-2";
  const errorClass = "text-red-400 text-xs mt-1 ml-1";

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="mx-auto w-16 h-16 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-white dark:text-gray-100" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white dark:text-gray-100 mb-2">
          UKM Robotik PNP
        </h1>
        <p className="text-gray-300 dark:text-gray-400 text-sm">
          Daftar calon anggota baru
        </p>
      </motion.div>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 dark:border-gray-700/30"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-500/10 border-red-500/50 text-red-200"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Nama Lengkap
            </label>
            <div className={inputContainerClass}>
              <User className={iconClass} />
              <input
                id="fullName"
                type="text"
                placeholder="Nama Lengkap Anda"
                className={`${inputClass} ${
                  errors.fullName ? "border-red-500 ring-red-500" : ""
                }`}
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className={errorClass}>{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <div className={inputContainerClass}>
              <Mail className={iconClass} />
              <input
                id="email"
                type="email"
                placeholder="nama@email.com"
                className={`${inputClass} ${
                  errors.email ? "border-red-500 ring-red-500" : ""
                }`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className={errorClass}>{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className={inputContainerClass}>
              <Lock className={iconClass} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                className={`${inputClass} pr-12 ${
                  errors.password ? "border-red-500 ring-red-500" : ""
                }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className={errorClass}>{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Konfirmasi Password
            </label>
            <div className={inputContainerClass}>
              <Lock className={iconClass} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••"
                className={`${inputClass} pr-12 ${
                  errors.confirmPassword ? "border-red-500 ring-red-500" : ""
                }`}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={errorClass}>{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                Daftar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </motion.button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-300 dark:text-gray-400">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 font-medium transition-colors duration-200"
              >
                Login disini
              </Link>
            </p>
          </div>
        </form>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center mt-8"
      >
        <p className="text-gray-400 dark:text-gray-500 text-xs">
          © 2024 UKM Robotik Politeknik Negeri Padang
        </p>
      </motion.div>
    </div>
  );
}
