"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  GraduationCap,
  Users,
  Calendar,
  ClipboardCheck,
  UserPlus,
} from "lucide-react";

export function RecruitmentDashboardCard() {
  const { roles } = useDashboard();

  if (!roles?.isRecruiter && !roles?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-green-200 dark:border-green-900/50 shadow-sm relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <GraduationCap className="w-32 h-32 text-green-500" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-8 bg-green-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Open Recruitment
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Kelola proses seleksi calon anggota baru (Caang).
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-medium">Total Caang</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              --
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <ClipboardCheck className="w-4 h-4" />
              <span className="text-xs font-medium">Terverifikasi</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              --
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Data Caang
          </button>
          <button className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Jadwal Aktivitas
          </button>
        </div>
      </div>
    </div>
  );
}
