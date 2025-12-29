"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { BookOpen, ClipboardCheck, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

export function CaangDashboardCard() {
  const { roles, isCaangVerified } = useDashboard();

  if (!roles?.isCaang) {
    return null;
  }

  // Jika belum terverifikasi, tampilkan pesan khusus
  if (!isCaangVerified) {
    return (
      <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-yellow-200 dark:border-yellow-900/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
          <AlertCircle className="w-32 h-32 text-yellow-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-8 bg-yellow-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Status Pendaftaran
            </h2>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50 mb-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Menunggu Verifikasi</span>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              Data pendaftaranmu sedang dalam proses verifikasi oleh panitia.
              Harap tunggu konfirmasi lebih lanjut.
            </p>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setelah terverifikasi, kamu akan mendapatkan akses ke materi
            pembelajaran dan fitur lainnya.
          </p>
        </div>
      </div>
    );
  }

  // Jika sudah terverifikasi
  return (
    <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <BookOpen className="w-32 h-32 text-emerald-500" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-8 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Panel Calon Anggota
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Selamat! Kamu sudah terverifikasi sebagai Caang. Akses materi dan
          ikuti proses seleksi.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium">Materi Selesai</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              --
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <ClipboardCheck className="w-4 h-4" />
              <span className="text-xs font-medium">Tugas Dikumpul</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              --
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/learning"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Materi & Tugas
          </Link>
          <Link
            href="/presence"
            className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Presensi Saya
          </Link>
        </div>
      </div>
    </div>
  );
}
