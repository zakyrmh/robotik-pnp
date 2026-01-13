"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore"; // Import Timestamp
import { auth, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { User, UserSchema } from "@/schemas/users";

// --- Helper Function untuk Serialization ---
// Mengubah Timestamp Firestore menjadi Date object standar JavaScript
// Fungsi ini berjalan rekursif untuk menangani nested object/array
const transformFirestoreData = (data: unknown): unknown => {
  if (data === null || data === undefined) return data;

  // Jika data adalah Timestamp Firestore, ubah ke JS Date
  if (data instanceof Timestamp) {
    return data.toDate();
  }

  // Jika object memiliki method toDate (duck typing untuk Timestamp)
  if (
    typeof data === "object" &&
    data !== null &&
    "toDate" in data &&
    typeof (data as { toDate: unknown }).toDate === "function"
  ) {
    return (data as { toDate: () => Date }).toDate();
  }

  // Jika Array, lakukan rekursif untuk setiap item
  if (Array.isArray(data)) {
    return data.map((item) => transformFirestoreData(item));
  }

  // Jika Object, lakukan rekursif untuk setiap value
  if (typeof data === "object") {
    const transformed: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        transformed[key] = transformFirestoreData(obj[key]);
      }
    }
    return transformed;
  }

  return data;
};

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
            const rawData = snap.data();
            // PERBAIKAN DI SINI:
            // Transform data sebelum disimpan ke state
            const serializedData = transformFirestoreData(rawData);

            // Catatan: Pastikan Schema Zod Anda mendukung tipe 'Date' untuk field timestamp
            // atau gunakan 'as unknown as User' jika ingin bypass sementara.
            const result = UserSchema.safeParse(serializedData);
            if (result.success) {
              setUserData(result.data); // Data dijamin valid
            } else {
              console.error("Schema validation failed:", result.error);
              setUserData(serializedData as User); // Fallback
            }
          } else {
            console.warn("User data not found in Firestore");
            setUserData(null);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Gagal mengambil data user");
        }
      } else {
        // PERBAIKAN: Sinkronisasi cookie dengan auth state
        // Jika user null tapi cookie session masih ada, hapus cookie tersebut
        // Ini mengatasi masalah "ghost session" dimana cookie masih ada tapi auth state sudah expired
        const sessionCookie = Cookies.get("session");
        if (sessionCookie) {
          console.warn(
            "Auth state is null but session cookie exists. Removing stale cookie..."
          );
          Cookies.remove("session");

          // Redirect ke login jika sedang di protected route
          const currentPath = window.location.pathname;
          const protectedRoutes = [
            "/dashboard",
            "/caang-management",
            "/activity-management",
            "/attendance-management",
            "/group-management",
            "/timeline",
            "/presence",
            "/material",
            "/group",
          ];

          const isOnProtectedRoute = protectedRoutes.some((route) =>
            currentPath.startsWith(route)
          );

          if (isOnProtectedRoute) {
            router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          }
        }

        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Login function
  const login = async (
    email: string,
    password: string,
    redirectTo?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Dapatkan ID Token
      const idToken = await userCredential.user.getIdToken();

      // Kirim ID Token ke server untuk create session cookie (Pastikan API Route sudah ada)
      // Jika API Route belum ada, bagian ini bisa di-comment dulu agar login tetap jalan di client
      try {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok)
          console.warn("Session creation failed, but client login success.");
      } catch (sessionErr) {
        console.warn("Session API not reachable:", sessionErr);
      }

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
      if (auth.currentUser) {
        // Menggunakan dynamic import untuk menghindari circular dependency
        try {
          const { setUserOffline } = await import(
            "@/lib/firebase/services/user-status"
          );
          await setUserOffline(auth.currentUser.uid);
        } catch (statusErr) {
          console.warn("Failed to set offline status:", statusErr);
        }
      }

      await firebaseSignOut(auth);

      router.push("/login");

      // Remove session cookie
      Cookies.remove("session");

      // Optional: Hit API if needed (commented out as it causes issues if route doesn't exist)
      /* 
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } catch (sessionErr) {
        console.warn("Logout session API failed:", sessionErr);
      }
      */

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
