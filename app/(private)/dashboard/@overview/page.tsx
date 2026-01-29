"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { OverviewDashboardCard } from "@/components/dashboard/cards/overview-card";
import { OverviewCard as CaangOverviewCard } from "@/components/dashboard/caang/overview-card";
import { RegistrationStatusCard } from "@/components/dashboard/caang/registration-status-card";
import { RegistrationForm } from "@/components/dashboard/caang/registration-form";
import { Loader2 } from "lucide-react";

export default function OverviewPage() {
  const {
    roles,
    isLoading,
    isCaangVerified,
    registration,
    registrationLoading,
  } = useDashboard();

  // Show loading state
  if (isLoading || registrationLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // KHUSUS CAANG
  if (roles?.isCaang) {
    // Jika sudah verified - tampilkan overview + status card
    if (isCaangVerified) {
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
    const getHeaderInfo = () => {
      if (!registration) {
        return {
          title: "Mulai Pendaftaran",
          description:
            "Lengkapi data pendaftaran Anda untuk bergabung dengan UKM Robotik PNP.",
        };
      }

      switch (registration.status) {
        case "rejected":
          return {
            title: "Perbaiki Data Pendaftaran",
            description:
              "Pendaftaran Anda ditolak. Silakan perbaiki data dan ajukan kembali.",
          };
        case "draft":
          return {
            title: "Lanjutkan Pendaftaran",
            description:
              "Anda sudah mulai mengisi data. Lanjutkan untuk melengkapi pendaftaran.",
          };
        case "in_progress":
          return {
            title: "Lanjutkan Pendaftaran",
            description:
              "Lengkapi semua langkah pendaftaran untuk mengirim verifikasi.",
          };
        default:
          return {
            title: "Pendaftaran",
            description: "Lengkapi data pendaftaran Anda.",
          };
      }
    };

    const headerInfo = getHeaderInfo();

    return (
      <div className="space-y-6">
        {/* Header Info - untuk semua status kecuali verified dan submitted */}
        <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">
            {headerInfo.title}
          </h2>
          <p className="text-muted-foreground">{headerInfo.description}</p>
        </div>

        {/* Registration Form */}
        <RegistrationForm />
      </div>
    );
  }

  // NON CAANG (Member, Admin, etc)
  return <OverviewDashboardCard />;
}
