"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import AdminDashboard from "@/app/(private)/dashboard/adminPage";
import CaangDashboard from "@/app/(private)/dashboard/caangPage";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role);
        } else {
          console.log("User data not found");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen -mt-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium">Memuat dashboard...</span>
      </div>
    );
  }

  return <>{role == "admin" ? <AdminDashboard /> : <CaangDashboard />}</>;
}
