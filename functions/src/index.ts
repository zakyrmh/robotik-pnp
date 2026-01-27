/**
 * Firebase Cloud Functions - Entry Point
 *
 * Menerapkan konsep "Atomic & Secure":
 * - Semua operasi sensitif dijalankan di server
 * - Validasi, pembuatan akun, dan penyimpanan database dalam satu paket
 * - Mengurangi risiko race condition dan data inconsistency
 *
 * @version 1.4.0
 * @see https://firebase.google.com/docs/functions
 */

export * from "./auth/register";
