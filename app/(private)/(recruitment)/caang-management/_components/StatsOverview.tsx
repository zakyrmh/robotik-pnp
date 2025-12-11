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
        return "border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 dark:border-yellow-800";
      case "success":
        return "border-green-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 dark:border-green-800";
      case "destructive":
        return "border-red-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 dark:border-red-800";
      default:
        return "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:border-gray-700";
    }
  };

  return (
    <Card className={`${getStyles()}`}>
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