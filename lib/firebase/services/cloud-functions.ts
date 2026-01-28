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
  verificationLink?: string;
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

/**
 * Memanggil Cloud Function untuk operasi lain (template)
 * Tambahkan lebih banyak function sesuai kebutuhan
 */
// export async function callAnotherFunction(data: SomeType): Promise<CloudFunctionResult> {
//   const fn = httpsCallable(functions, "anotherFunction");
//   const result = await fn(data);
//   return result.data as CloudFunctionResult;
// }
