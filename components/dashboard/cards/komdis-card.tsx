"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Shield, AlertTriangle, Calendar, ClipboardList } from "lucide-react";

export function KomdisDashboardCard() {
  const { roles } = useDashboard();

  if (!roles?.isKomdis && !roles?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <Shield className="w-32 h-32 text-red-500" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-8 bg-red-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Komisi Disiplin
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Pantau dan kelola kedisiplinan anggota UKM Robotik.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Pelanggaran</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              --
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <ClipboardList className="w-4 h-4" />
              <span className="text-xs font-medium">Sanksi Aktif</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              --
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Presensi
          </button>
          <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Input Pelanggaran
          </button>
        </div>
      </div>
    </div>
  );
}
