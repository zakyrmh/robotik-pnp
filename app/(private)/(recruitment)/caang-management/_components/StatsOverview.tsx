"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, CreditCard, CheckCircle, Ban } from "lucide-react";

interface StatsData {
  total: number;
  pendingVerification: number;
  activeLolos: number;
  blacklisted: number;
}

interface StatsOverviewProps {
  stats: StatsData;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Pendaftar"
        value={stats.total}
        icon={<User className="h-4 w-4" />}
      />
      <StatsCard
        title="Menunggu Verifikasi"
        value={stats.pendingVerification}
        icon={<CreditCard className="h-4 w-4" />}
        variant="warning"
      />
      <StatsCard
        title="Lolos / Aktif"
        value={stats.activeLolos}
        icon={<CheckCircle className="h-4 w-4" />}
        variant="success"
      />
      <StatsCard
        title="Blacklist / Gugur"
        value={stats.blacklisted}
        icon={<Ban className="h-4 w-4" />}
        variant="destructive"
      />
    </div>
  );
}

// Sub-component lokal (hanya dipakai disini)
function StatsCard({
  title,
  value,
  icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "success" | "destructive";
}) {
  const getStyles = () => {
    switch (variant) {
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      case "destructive":
        return "bg-red-50 border-red-200 text-red-900";
      default:
        return "bg-card";
    }
  };

  return (
    <Card className={`${getStyles()} shadow-sm`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="opacity-50">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}