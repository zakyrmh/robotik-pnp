/**
 * Cloud Functions Client Service
 *
 * Service untuk memanggil Cloud Functions dari client-side.
 * Menggunakan httpsCallable dari Firebase SDK v12.
 *
 * @version 1.4.0
 * @see https://firebase.google.com/docs/functions/callable
 */

import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import { app } from "@/lib/firebase/config";
import { RegisterValues } from "@/schemas/auth";

// Initialize Firebase Functions dengan region
const functions = getFunctions(app, "asia-southeast2");

// Connect ke emulator jika di development
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_EMULATOR === "true"
) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// ============================================
// TYPES
// ============================================

export interface CloudFunctionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface RegisterUserResponse {
  success: boolean;
  message: string;
  userId?: string;
  customToken?: string;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Memanggil Cloud Function untuk registrasi user baru.
 *
 * Konsep "Atomic & Secure":
 * - Semua logika registrasi dijalankan di server
 * - Client hanya mengirim data dan menerima response
 * - Tidak ada akses langsung ke Firebase Auth SDK dari client
 *
 * @param values - Data registrasi (fullName, email, password, confirmPassword)
 * @returns Promise<CloudFunctionResult<RegisterUserResponse>>
 */
export async function callRegisterUser(
  values: RegisterValues,
): Promise<CloudFunctionResult<RegisterUserResponse>> {
  try {
    const registerUserFn = httpsCallable<RegisterValues, RegisterUserResponse>(
      functions,
      "registerUser",
    );

    const result = await registerUserFn(values);

    return {
      success: result.data.success,
      message: result.data.message,
      data: result.data,
    };
  } catch (error: unknown) {
    // Handle Firebase Functions error
    const functionsError = error as {
      code?: string;
      message?: string;
      details?: { field?: string };
    };

    console.error("Cloud Function Error:", functionsError);

    // Map error codes ke pesan user-friendly
    let errorMessage = "Terjadi kesalahan sistem.";

    if (functionsError.message) {
      errorMessage = functionsError.message;
    }

    // Specific error handling
    const errorCode = functionsError.code || "";

    if (errorCode.includes("already-exists")) {
      errorMessage = "Email sudah terdaftar. Gunakan email lain.";
    } else if (errorCode.includes("invalid-argument")) {
      errorMessage = functionsError.message || "Data tidak valid.";
    } else if (errorCode.includes("unauthenticated")) {
      errorMessage = "Sesi tidak valid. Silakan refresh halaman.";
    } else if (errorCode.includes("unavailable")) {
      errorMessage = "Layanan sedang tidak tersedia. Coba lagi nanti.";
    } else if (errorCode.includes("resource-exhausted")) {
      // Rate limit exceeded
      errorMessage =
        functionsError.message ||
        "Terlalu banyak percobaan. Silakan coba lagi nanti.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// LOGIN FUNCTIONS
// ============================================

export interface LoginUserInput {
  email: string;
  password: string;
  device?: string;
  rememberMe?: boolean;
}

export interface LoginUserResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  // Flow baru: Validasi sukses, silakan lanjut login di client
  canProceed?: boolean;
  // Flow lama (deprecated but kept for types):
  customToken?: string;
  user?: {
    uid: string;
    email: string;
    displayName: string | undefined;
    emailVerified: boolean;
    roles: Record<string, boolean>;
  };
  sessionId?: string;
  requiresEmailVerification?: boolean;
  email?: string;
}

/**
 * Memanggil Cloud Function untuk login user.
 *
 * Fitur keamanan:
 * - Rate Limiting (5x per 15 menit)
 * - Email Verification Check
 * - Account Status Check (disabled/blacklisted)
 * - Audit Logging
 * - Session Tracking (24 jam expiry)
 *
 * @param values - Data login (email, password, device, rememberMe)
 * @returns Promise<CloudFunctionResult<LoginUserResponse>>
 */
export async function callLoginUser(
  values: LoginUserInput,
): Promise<CloudFunctionResult<LoginUserResponse>> {
  try {
    const loginUserFn = httpsCallable<LoginUserInput, LoginUserResponse>(
      functions,
      "loginUser",
    );

    const result = await loginUserFn(values);

    if (result.data.success) {
      return {
        success: true,
        message: result.data.message,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.data.error || "Login gagal.",
        data: result.data,
      };
    }
  } catch (error: unknown) {
    const functionsError = error as {
      code?: string;
      message?: string;
    };

    console.error("Login Cloud Function Error:", functionsError);

    let errorMessage = "Terjadi kesalahan saat login.";
    const errorCode = functionsError.code || "";

    if (errorCode.includes("unavailable")) {
      errorMessage = "Layanan sedang tidak tersedia. Coba lagi nanti.";
    } else if (errorCode.includes("internal")) {
      errorMessage = "Terjadi kesalahan internal. Coba lagi nanti.";
    } else if (functionsError.message) {
      errorMessage = functionsError.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// SESSION FUNCTIONS
// ============================================

/**
 * Cek apakah session masih valid (belum expired 24 jam)
 * Digunakan untuk force re-authentication
 *
 * @param sessionId - Session ID dari login
 * @returns Promise<boolean>
 */
export async function checkSessionValid(
  sessionId: string,
): Promise<{ valid: boolean; message?: string }> {
  try {
    // Untuk sekarang, cek via localStorage
    // Di production, bisa cek ke Firestore
    const sessionData = localStorage.getItem("session_data");

    if (!sessionData) {
      return { valid: false, message: "Sesi tidak ditemukan." };
    }

    const parsed = JSON.parse(sessionData);

    if (parsed.sessionId !== sessionId) {
      return { valid: false, message: "Sesi tidak valid." };
    }

    const expiresAt = new Date(parsed.expiresAt).getTime();
    const now = Date.now();

    if (now > expiresAt) {
      return {
        valid: false,
        message: "Sesi telah expired. Silakan login kembali.",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, message: "Gagal memvalidasi sesi." };
  }
}

/**
 * Simpan session data ke localStorage
 */
export function saveSessionData(data: {
  sessionId: string;
  userId: string;
  expiresAt: Date;
}): void {
  localStorage.setItem(
    "session_data",
    JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      expiresAt: data.expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    }),
  );
}

/**
 * Hapus session data dari localStorage
 */
export function clearSessionData(): void {
  localStorage.removeItem("session_data");
}
