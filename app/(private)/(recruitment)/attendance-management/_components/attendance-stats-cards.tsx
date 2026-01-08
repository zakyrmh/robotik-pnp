"use client";

import { cn } from "@/lib/utils";
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  HeartPulse,
  UserX,
} from "lucide-react";
import { AttendanceStats } from "@/lib/firebase/services/attendance-service";

// =========================================================
// STATS CARD COMPONENT
// =========================================================

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("p-2 rounded-full", bgColor)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

// =========================================================
// MAIN STATS CARDS COMPONENT
// =========================================================

interface AttendanceStatsCardsProps {
  stats: AttendanceStats;
}

export function AttendanceStatsCards({ stats }: AttendanceStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatsCard
        title="Total Caang"
        value={stats.totalCaang}
        icon={Users}
        iconColor="text-slate-600 dark:text-slate-400"
        bgColor="bg-slate-100 dark:bg-slate-800"
      />
      <StatsCard
        title="Hadir"
        value={stats.present}
        icon={UserCheck}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-950/50"
      />
      <StatsCard
        title="Terlambat"
        value={stats.late}
        icon={Clock}
        iconColor="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-100 dark:bg-amber-950/50"
      />
      <StatsCard
        title="Izin"
        value={stats.excused}
        icon={FileText}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-950/50"
      />
      <StatsCard
        title="Sakit"
        value={stats.sick}
        icon={HeartPulse}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-950/50"
      />
      <StatsCard
        title="Alfa"
        value={stats.absent}
        icon={UserX}
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-950/50"
      />
    </div>
  );
}
