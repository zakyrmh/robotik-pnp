"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { UAParser } from "ua-parser-js";
import { LoginSchema, LoginValues } from "@/schemas/auth";
import {
  callLoginUser,
  saveSessionData,
} from "@/lib/firebase/services/cloud-functions";
import { auth } from "@/lib/firebase/config";
import { setUserOnline } from "@/lib/firebase/services/user-status";

// Icons
import { AlertCircle, Mail, CheckCircle } from "lucide-react";

/**
 * Helper function to get device info - called only during form submission
 */
function getDeviceInfo(): string {
  try {
    const parser = new UAParser();
    const { browser, os, device } = parser.getResult();

    const browserName = browser.name || "Unknown Browser";
    const osName = os.name || "Unknown OS";
    const osVersion = os.version || "";

    let deviceName = `${browserName} on ${osName} ${osVersion}`;

    if (device.model) {
      deviceName += ` (${device.vendor ? device.vendor + " " : ""}${device.model})`;
    }

    return deviceName.trim();
  } catch {
    return "Unknown Device";
  }
}

export default function LoginForm() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showEmailVerificationHint, setShowEmailVerificationHint] =
    useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const form = useForm({
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
    setShowEmailVerificationHint(false);
    setUnverifiedEmail(null);

    // Call Cloud Function for secure login validation
    const result = await callLoginUser({
      email: data.email,
      password: data.password,
      device: getDeviceInfo(),
      rememberMe: data.rememberMe,
    });

    if (
      result.success &&
      (result.data?.canProceed || result.data?.customToken)
    ) {
      try {
        let userCredential;

        if (result.data.canProceed) {
          // New flow: Validation successful, proceed with client-side login
          userCredential = await signInWithEmailAndPassword(
            auth,
            data.email,
            data.password,
          );
        } else if (result.data.customToken) {
          // Old flow (fallback): Sign in with custom token
          userCredential = await signInWithCustomToken(
            auth,
            result.data.customToken,
          );
        } else {
          throw new Error("Invalid login response");
        }

        // Get ID Token for session cookie
        const idToken = await userCredential.user.getIdToken();

        // Set session cookie
        const cookieOptions = {
          expires: data.rememberMe ? 7 : 1,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict" as const,
        };
        Cookies.set("session", idToken, cookieOptions);

        // Save session data for re-auth tracking
        if (result.data.sessionId) {
          // Calculate expiry inside async callback to avoid impure function during render
          const expiresAt = new Date(
            new Date().getTime() + 24 * 60 * 60 * 1000,
          ); // 24 jam
          saveSessionData({
            sessionId: result.data.sessionId,
            userId: result.data.user?.uid || userCredential.user.uid,
            expiresAt,
          });
        }

        // Set online presence with sessionId
        await setUserOnline(
          userCredential.user.uid,
          getDeviceInfo(),
          result.data.sessionId,
        );

        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        console.error("Failed to complete login:", err);

        // Safely access error code
        const errorCode = (err as { code?: string })?.code;

        // Handle incorrect password from signInWithEmailAndPassword
        if (
          errorCode === "auth/wrong-password" ||
          errorCode === "auth/invalid-credential"
        ) {
          setGlobalError("Email atau password salah.");
        } else {
          setGlobalError("Gagal menyelesaikan proses login. Coba lagi.");
        }
      }
    } else {
      // Handle specific error codes
      const errorData = result.data;

      if (errorData?.code === "email_not_verified") {
        setShowEmailVerificationHint(true);
        setUnverifiedEmail(errorData.email || data.email);
        setGlobalError(null);
      } else {
        setGlobalError(result.error || "Login gagal.");
      }
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
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">{globalError}</p>
            </div>
          </div>
        )}

        {/* Email Not Verified Hint */}
        {showEmailVerificationHint && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-400 font-medium">
                  Email Belum Diverifikasi
                </p>
                <p className="text-xs text-yellow-300/80 mt-1">
                  Silakan cek inbox email{" "}
                  <span className="font-semibold">{unverifiedEmail}</span> dan
                  klik link verifikasi.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-yellow-300/60">
              <CheckCircle className="w-4 h-4" />
              <span>Cek juga folder Spam/Junk jika tidak ditemukan</span>
            </div>
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

        {/* Security Badge */}
        <div className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Login aman dengan enkripsi end-to-end
          </p>
        </div>
      </form>
    </div>
  );
}
