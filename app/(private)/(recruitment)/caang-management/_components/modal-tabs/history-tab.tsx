"use client";

import { CaangData } from "@/lib/firebase/services/caang-service";
import { History, Star, FileBarChart } from "lucide-react";

interface HistoryTabProps {
  caang: CaangData;
}

export function HistoryTab({}: HistoryTabProps) {
  // This tab is intentionally left mostly empty as per user request
  // Future implementation will include:
  // - Attendance history
  // - Task scores
  // - Activity logs

  return (
    <div className="space-y-6">
      {/* Coming Soon Notice */}
      <div className="bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
        <div className="relative inline-block mb-4">
          <History className="w-16 h-16 text-slate-300 dark:text-slate-600" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Riwayat & Nilai
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Fitur ini sedang dalam pengembangan. Nanti akan menampilkan riwayat
          presensi, nilai tugas, dan aktivitas calon anggota.
        </p>
      </div>

      {/* Placeholder Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            Riwayat Presensi
          </h4>
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
            Belum ada data presensi
          </div>
        </div>

        {/* Scores Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-green-500" />
            Nilai Tugas
          </h4>
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
            Belum ada data nilai
          </div>
        </div>
      </div>
    </div>
  );
}
