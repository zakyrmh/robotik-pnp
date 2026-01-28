/**
 * Firebase Cloud Functions - Entry Point
 *
 * Menerapkan konsep "Atomic & Secure":
 * - Semua operasi sensitif dijalankan di server
 * - Validasi, pembuatan akun, dan penyimpanan database dalam satu paket
 * - Mengurangi risiko race condition dan data inconsistency
 *
 * @version 1.5.0
 * @see https://firebase.google.com/docs/functions
 */

// Auth Functions
export * from "./auth/register";
export * from "./auth/login";
