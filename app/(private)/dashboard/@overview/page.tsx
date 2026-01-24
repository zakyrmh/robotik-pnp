"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { OverviewDashboardCard } from "@/components/dashboard/cards/overview-card";
import { OverviewCard as CaangOverviewCard } from "@/components/dashboard/caang/overview-card";
import { RegistrationStatusCard } from "@/components/dashboard/caang/registration-status-card";
import { RegistrationForm } from "@/components/dashboard/caang/registration-form";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Registration } from "@/schemas/registrations";

export default function OverviewPage() {
  const { roles, isLoading, user, isCaangVerified } = useDashboard();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoadingReg, setIsLoadingReg] = useState(true);

  // Fetch registration to determine what to show
  useEffect(() => {
    async function fetchRegistration() {
      if (!user?.uid || !roles?.isCaang) {
        setIsLoadingReg(false);
        return;
      }

      try {
        const regRef = doc(db, "registrations", user.uid);
        const regSnap = await getDoc(regRef);

        if (regSnap.exists()) {
          setRegistration({
            id: regSnap.id,
            ...regSnap.data(),
          } as Registration);
        }
      } catch (error) {
        console.error("Error fetching registration:", error);
      } finally {
        setIsLoadingReg(false);
      }
    }

    fetchRegistration();
  }, [user?.uid, roles?.isCaang]);

  if (isLoading || isLoadingReg) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // KHUSUS CAANG
  if (roles?.isCaang) {
    // Jika sudah verified - tampilkan overview biasa
    if (isCaangVerified || registration?.status === "verified") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CaangOverviewCard />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <RegistrationStatusCard />
          </div>
        </div>
      );
    }

    // Jika sudah submit dan menunggu verifikasi - tampilkan overview + status
    if (registration?.status === "submitted") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CaangOverviewCard />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <RegistrationStatusCard />
          </div>
        </div>
      );
    }

    // Jika belum ada registration atau masih draft/in_progress/rejected
    // Tampilkan form registrasi full width
    return (
      <div className="space-y-6">
        {/* Header Info - hanya untuk yang belum mulai atau rejected */}
        {(!registration || registration.status === "rejected") && (
          <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">
              {registration?.status === "rejected"
                ? "Perbaiki Data Pendaftaran"
                : "Mulai Pendaftaran"}
            </h2>
            <p className="text-muted-foreground">
              {registration?.status === "rejected"
                ? "Pendaftaran Anda ditolak. Silakan perbaiki data dan ajukan kembali."
                : "Lengkapi data pendaftaran Anda untuk bergabung dengan UKM Robotik PNP."}
            </p>
          </div>
        )}

        {/* Registration Form */}
        <RegistrationForm />
      </div>
    );
  }

  // NON CAANG (Member, Admin, etc)
  return <OverviewDashboardCard />;
}
