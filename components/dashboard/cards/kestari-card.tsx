"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { ClipboardList, Calendar, Clock, CheckCircle } from "lucide-react";

export function KestariDashboardCard() {
  const { roles } = useDashboard();

  if (!roles?.isKestari && !roles?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-cyan-200 dark:border-cyan-900/50 shadow-sm relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <ClipboardList className="w-32 h-32 text-cyan-500" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-8 bg-cyan-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Kesekretariatan
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Kelola jadwal piket dan administrasi anggota.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-cyan-50 dark:bg-cyan-950/30 p-3 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Piket Minggu Ini</span>
            </div>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
              --
            </p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-950/30 p-3 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Hadir</span>
            </div>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
              --
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Atur Jadwal
          </button>
          <button className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Lihat Piket
          </button>
        </div>
      </div>
    </div>
  );
}
