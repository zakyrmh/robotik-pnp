"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { User } from "@/types/users";

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Listen to auth state changes and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userRef = doc(db, "users_new", firebaseUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            setUserData(snap.data() as User);
          } else {
            console.warn("User data not found in Firestore");
            setUserData(null);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Gagal mengambil data user");
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      // Set offline status in RTDB before signing out
      if (auth.currentUser) {
        // Dynamic import to avoid circular dependencies if any, though likely safe to import at top
        const { setUserOffline } = await import(
          "@/lib/firebase/services/user-status"
        );
        await setUserOffline(auth.currentUser.uid);
      }

      // Sign out dari Firebase Auth
      await firebaseSignOut(auth);

      // Hapus session cookie di server
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Redirect ke login
      router.push("/login");
      router.refresh();

      setUser(null);
      setUserData(null);
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
    userData,
    loading,
    error,
    login,
    logout,
  };
}
