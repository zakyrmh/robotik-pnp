"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Settings, Users, Calendar, FileText, BarChart3 } from "lucide-react";

export function ManagementDashboardCard() {
  const { roles, isPresidium } = useDashboard();

  if (!roles?.isSuperAdmin && !isPresidium) {
    return null;
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <Settings className="w-40 h-40 text-blue-500" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Panel Manajemen
            </h2>
          </div>
          {roles?.isSuperAdmin && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
              Super Admin
            </span>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Akses penuh ke manajemen organisasi dan pengaturan sistem.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Total Anggota</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              --
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Kegiatan Aktif</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              --
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Dokumen</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              --
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium">Laporan</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              --
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Kelola User
          </button>
          <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Jadwal Piket
          </button>
          <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
