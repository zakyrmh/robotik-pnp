"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { OverviewDashboardCard } from "@/components/dashboard/cards/overview-card";
import { OverviewCard as CaangOverviewCard } from "@/components/dashboard/caang/overview-card";
import { RegistrationStatusCard } from "@/components/dashboard/caang/registration-status-card";
import { Loader2 } from "lucide-react";

export default function OverviewPage() {
  const { roles, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // KHUSUS CAANG: Gunakan overview yang ada sekarang dengan berbagai informasi
  if (roles?.isCaang) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Overview (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <CaangOverviewCard />
        </div>

        {/* Card 2: Status Pendaftaran (Takes 1 column) */}
        <div className="lg:col-span-1 space-y-6">
          <RegistrationStatusCard />
        </div>
      </div>
    );
  }

  // NON CAANG (Member, Admin, etc): Kembalikan overview lama (kegiatan hari ini, status akun, dll)
  return <OverviewDashboardCard />;
}
