"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // Ensure you run: npm install js-cookie @types/js-cookie
import { LoginSchema, LoginValues } from "@/schemas/auth";
import { loginWithEmail } from "@/lib/firebase/auth";

// Separation of Concerns:
// This component handles the UI Presentation and Form State Management.
// It delegates the actual business logic (authentication) to the service layer (@/lib/firebase/auth).

export default function LoginForm() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: LoginValues) => {
    setGlobalError(null);

    // 1. Call Service Layer for Firebase Auth
    const result = await loginWithEmail(data);

    if (result.success && result.user) {
      // 2. Middleware Protection Fix: Set 'session' cookie
      // We manually set the cookie because Firebase client-side auth doesn't do it automatically for Next.js Middleware.
      try {
        const token = await result.user.getIdToken();

        // Define cookie options
        // If "Remember Me" is checked, expire in 7 days, else 1 day (or session)
        const cookieOptions = {
          expires: data.rememberMe ? 7 : 1,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict" as const,
        };

        Cookies.set("session", token, cookieOptions);

        // 3. Redirect
        // Refresh router to ensure middleware and new cookie state are recognized
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        console.error("Failed to set session cookie:", err);
        setGlobalError("Gagal menyimpan sesi login.");
      }
    } else {
      // Show error handling from Service Layer
      setGlobalError(result.error || "Login gagal.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Selamat Datang
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Masuk ke akun Robotik PNP Anda
        </p>
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
              autoComplete="current-password"
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                {...register("rememberMe")}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-300"
              >
                Ingat Saya
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-500 hover:text-blue-400"
              >
                Lupa password?
              </a>
            </div>
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
              "Sign In"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
