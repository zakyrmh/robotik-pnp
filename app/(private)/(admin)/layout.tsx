"use client";

import { app } from "@/lib/firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users_new", user.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            if (data.role === "admin") {
              setIsAuthorized(true);
              setIsLoading(false);
            } else {
              router.push("/dashboard");
            }
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsub();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}