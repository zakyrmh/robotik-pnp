"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const user = auth.currentUser;

  // Login function
  const login = async (
    email: string,
    password: string,
    redirectTo?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Sign in dengan Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Dapatkan ID Token
      const idToken = await userCredential.user.getIdToken();

      // Kirim ID Token ke server untuk create session cookie
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      // Redirect ke halaman tujuan atau dashboard
      router.push(redirectTo || "/dashboard");
      router.refresh();

      return userCredential.user;
    } catch (err) {
      if (err instanceof FirebaseError) {
        const errorMessage =
          err.code === "auth/user-not-found"
            ? "User tidak ditemukan"
            : err.code === "auth/wrong-password"
            ? "Password salah"
            : err.code === "auth/invalid-email"
            ? "Email tidak valid"
            : "Terjadi kesalahan saat login";

        setError(errorMessage);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sign out dari Firebase Auth
      await firebaseSignOut(auth);

      // Hapus session cookie di server
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Redirect ke login
      router.push("/login");
      router.refresh();
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError("Terjadi kesalahan saat logout");
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    login,
    logout,
    loading,
    error,
  };
}
