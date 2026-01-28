"use client";

import { useState, useCallback } from "react";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";

// ============================================
// TYPES
// ============================================

export interface ReAuthResult {
  success: boolean;
  error?: string;
}

export interface UseReAuthReturn {
  isReAuthRequired: boolean;
  isReAuthenticating: boolean;
  error: string | null;
  checkSessionExpiry: () => boolean;
  triggerReAuth: () => void;
  performReAuth: (password: string) => Promise<ReAuthResult>;
  cancelReAuth: () => void;
}

// ============================================
// CONFIGURATION
// ============================================

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 jam

// ============================================
// HOOK
// ============================================

/**
 * Hook untuk Force Re-Authentication
 *
 * Digunakan untuk:
 * - Aksi sensitif (ganti password, hapus akun, dll)
 * - Session expired setelah 24 jam
 *
 * @returns UseReAuthReturn
 */
export function useReAuth(): UseReAuthReturn {
  const [isReAuthRequired, setIsReAuthRequired] = useState(false);
  const [isReAuthenticating, setIsReAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cek apakah session sudah expired (24 jam sejak login)
   */
  const checkSessionExpiry = useCallback((): boolean => {
    try {
      const sessionData = localStorage.getItem("session_data");

      if (!sessionData) {
        return true; // No session = expired
      }

      const parsed = JSON.parse(sessionData);
      const expiresAt = new Date(parsed.expiresAt).getTime();
      const now = Date.now();

      return now > expiresAt;
    } catch {
      return true; // Error = treat as expired
    }
  }, []);

  /**
   * Trigger dialog re-auth
   */
  const triggerReAuth = useCallback(() => {
    setIsReAuthRequired(true);
    setError(null);
  }, []);

  /**
   * Cancel re-auth
   */
  const cancelReAuth = useCallback(() => {
    setIsReAuthRequired(false);
    setError(null);
  }, []);

  /**
   * Perform re-authentication dengan password
   */
  const performReAuth = useCallback(
    async (password: string): Promise<ReAuthResult> => {
      setIsReAuthenticating(true);
      setError(null);

      try {
        const currentUser = auth.currentUser as User | null;

        if (!currentUser) {
          setError("User tidak ditemukan. Silakan login ulang.");
          return { success: false, error: "User tidak ditemukan." };
        }

        if (!currentUser.email) {
          setError("Email user tidak ditemukan.");
          return { success: false, error: "Email tidak ditemukan." };
        }

        // Create credential
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          password,
        );

        // Re-authenticate
        await reauthenticateWithCredential(currentUser, credential);

        // Update session expiry
        const newExpiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
        const sessionData = localStorage.getItem("session_data");

        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          localStorage.setItem(
            "session_data",
            JSON.stringify({
              ...parsed,
              expiresAt: newExpiresAt.toISOString(),
              lastReAuthAt: new Date().toISOString(),
            }),
          );
        }

        setIsReAuthRequired(false);
        return { success: true };
      } catch (err: unknown) {
        const firebaseError = err as { code?: string; message?: string };

        let errorMessage = "Re-autentikasi gagal.";

        if (firebaseError.code === "auth/wrong-password") {
          errorMessage = "Password salah.";
        } else if (firebaseError.code === "auth/too-many-requests") {
          errorMessage = "Terlalu banyak percobaan. Coba lagi nanti.";
        } else if (firebaseError.code === "auth/invalid-credential") {
          errorMessage = "Kredensial tidak valid.";
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsReAuthenticating(false);
      }
    },
    [],
  );

  return {
    isReAuthRequired,
    isReAuthenticating,
    error,
    checkSessionExpiry,
    triggerReAuth,
    performReAuth,
    cancelReAuth,
  };
}

/**
 * Higher-order function untuk wrap aksi sensitif dengan re-auth check
 *
 * @param action - Aksi yang memerlukan re-auth
 * @param reAuthHook - Instance dari useReAuth
 * @returns Wrapped action
 */
export function withReAuth<T extends (...args: unknown[]) => Promise<unknown>>(
  action: T,
  reAuthHook: UseReAuthReturn,
): (...args: Parameters<T>) => Promise<ReturnType<T> | { cancelled: true }> {
  return async (...args: Parameters<T>) => {
    // Check if session expired
    if (reAuthHook.checkSessionExpiry()) {
      reAuthHook.triggerReAuth();
      // Return a marker that action was cancelled due to re-auth requirement
      return { cancelled: true } as ReturnType<T> | { cancelled: true };
    }

    // Execute action
    return action(...args) as Promise<ReturnType<T>>;
  };
}
