"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import AdminDashboard from "@/app/(private)/dashboard/adminPage";
import CaangDashboard from "@/app/(private)/dashboard/(caang)/caangPage";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  // Redirect jika tidak login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Tampilkan loading saat cek auth atau fetch data user
  if (loading) {
    return <Loading />;
  }

  // Jika user login tapi data profile tidak ditemukan di Firestore
  if (!userData) {
    return null;
  }

  const { roles } = userData;

  if (!roles) {
    return <div className="p-4 text-center">Error: User roles not found.</div>;
  }

  const isInternalUser =
    roles.isSuperAdmin ||
    roles.isRecruiter ||
    roles.isKestari ||
    roles.isKomdis ||
    roles.isOfficialMember ||
    roles.isKRIMember;

  if (isInternalUser) {
    return <AdminDashboard user={userData} />;
  }

  if (roles.isCaang) {
    return <CaangDashboard />;
  }

  return (
    <div className="p-4 text-center">
      Role user tidak dikenali. Hubungi admin.
    </div>
  );
}
