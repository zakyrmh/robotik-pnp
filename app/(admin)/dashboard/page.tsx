"use client";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        const checkVerificationStatus = async () => {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && !(userDoc.data()?.role)) {
            router.push("/verification");
          }
        };
        checkVerificationStatus();
      }
    }
  }, [authLoading, user, router]);

  return <div>Dashboard</div>;
}
