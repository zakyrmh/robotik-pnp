"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Activity, Bell, Calendar, CheckCircle, Clock } from "lucide-react";

export function OverviewDashboardCard() {
  const { userProfile, roles, isCaangVerified } = useDashboard();

  // Determine user status badge
  const getStatusBadge = () => {
    if (roles?.isSuperAdmin) {
      return {
        label: "Super Admin",
        color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      };
    }
    if (roles?.isAlumni) {
      return {
        label: "Alumni",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
    }
    if (roles?.isCaang) {
      return isCaangVerified
        ? {
            label: "Caang Terverifikasi",
            color:
              "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
          }
        : {
            label: "Caang (Belum Verifikasi)",
            color:
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
          };
    }
    if (roles?.isOfficialMember) {
      return {
        label: "Anggota Resmi",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      };
    }
    if (roles?.isKRIMember) {
      return {
        label: "Anggota KRI",
        color:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
      };
    }
    return {
      label: "Member",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
  };

  const status = getStatusBadge();

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Overview
          </h2>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Welcome Message */}
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Selamat datang di Sistem Informasi Robotik PNP,{" "}
        {userProfile?.fullName || "User"}!
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Kegiatan Hari Ini</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            --
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Status Akun</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            Aktif
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-medium">Pengumuman Baru</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            --
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Clock className="w-4 h-4" />
          <span>Aktivitas Terbaru</span>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          Belum ada aktivitas terbaru.
        </p>
      </div>
    </div>
  );
}
