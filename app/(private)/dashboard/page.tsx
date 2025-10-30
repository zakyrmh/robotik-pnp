"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import AdminDashboard from "@/app/(private)/dashboard/adminPage";
import CaangDashboard from "@/app/(private)/dashboard/caangPage";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users_new", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role);
        } else {
          console.log("User data not found");
        }
      } catch (err) {
        console.error(err);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <>{role == "admin" ? <AdminDashboard /> : <CaangDashboard />}</>;
}
