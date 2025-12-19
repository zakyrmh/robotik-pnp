import React, { useState, useEffect } from "react";
import { getRegistrationById } from "@/lib/firebase/services/registration-service";
import { Registration } from "@/types/registrations";
import Loading from "@/components/Loading";
import { RegistrationStatus } from "@/types/enum";
import AccessDenied from "@/app/(private)/dashboard/(caang)/_components/AccessDenied";
import VerifiedDashboard from "@/app/(private)/dashboard/(caang)/_components/VerifiedDashboard";
import WaitingDashboard from "@/app/(private)/dashboard/(caang)/_components/WaitingDashboard";
import RegistrationDashboard from "@/app/(private)/dashboard/(caang)/_components/RegistrationDashboard";
import { useAuth } from "@/hooks/useAuth";

export default function CaangDashboard() {
  const { user, userData, loading } = useAuth();
  const [caang, setCaang] = useState<Registration | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const data = await getRegistrationById(user.uid);

        if (data) {
          setCaang(data);
        } else {
          console.warn("Dokumen registration tidak ditemukan untuk user ini!");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  // 1. Cek Akses User
  if (
    userData &&
    (userData.deletedAt ||
      userData.blacklistInfo?.isBlacklisted ||
      !userData.isActive)
  ) {
    return <AccessDenied user={userData} />;
  }

  // Helper untuk cek status
  const status = caang?.status;
  const verification = caang?.verification;

  // Cek Training/Verified (Dashboard 3)
  const isVerified =
    (status === RegistrationStatus.VERIFIED && verification?.verified) || false;

  // Cek Waiting (Dashboard 2)
  const isWaiting = status === RegistrationStatus.SUBMITTED;

  // DASHBOARD 3: PELATIHAN (Verified)
  if (isVerified) {
    return <VerifiedDashboard caang={caang} />;
  }

  // DASHBOARD 2: MENUNGGU VERIFIKASI
  if (isWaiting) {
    return <WaitingDashboard user={userData} caang={caang} />;
  }

  // DASHBOARD 1: FORM PENDAFTARAN (Draft / Rejected / Need Revisions)
  return <RegistrationDashboard user={userData} caang={caang} />;
}
