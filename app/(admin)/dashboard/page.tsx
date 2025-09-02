"use client";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardCaang from "./caang";
import AdminDashboard from "./admin";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const checkRegistration = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        setRole(snap.data()?.role);
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [user, authLoading, router]);

  return <>{role == "admin" ? <AdminDashboard /> : <DashboardCaang />}</>;
}
