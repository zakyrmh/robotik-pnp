"use client";

import { Calendar, Clock, GraduationCap } from "lucide-react";

export default function ActivePhase() {
  return (
    <div className="mb-8 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Fase Aktif Saat Ini
        </h3>
        <span className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-bold flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
          SEDANG BERLANGSUNG
        </span>
      </div>

      {/* Main Card */}
      <div
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 
                    dark:from-blue-900 dark:via-blue-800 dark:to-purple-900
                    rounded-2xl p-8 text-white shadow-xl transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            {/* Info Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-16 h-16 bg-white/20 dark:bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-12 w-12 text-white dark:text-blue-200" />
              </div>
              <div>
                <h4 className="text-2xl font-bold uppercase">pelatihan</h4>
                <p className="text-blue-100 dark:text-blue-200/80">
                  Elektronika Dasar
                </p>
              </div>
            </div>

            <p className="text-blue-100 dark:text-blue-200 mb-4">
              Anda sedang dalam fase pelatihan. Pastikan mengikuti semua sesi
              tepat waktu.
            </p>

            <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="text-blue-100 dark:text-blue-300 h-4 w-4" />
                  <span>
                    12 Oktober - 16 Novermber 2025
                  </span>
                </div>
              <div className="flex items-center space-x-2">
                <Clock className="text-blue-100 dark:text-blue-300 h-4 w-4" />
                <span>Total: 4 sesi</span>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="text-right">
            <p className="text-sm text-blue-100 dark:text-blue-200 mb-2">
              Kehadiran
            </p>
            <p className="text-5xl font-bold mb-1 text-white dark:text-blue-100">
              999%
            </p>
          </div>
        </div>

        {/* Progress per kategori */}
        {/* {showCategoryProgress && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span
                    className={`text-xs ${cat.bgColor} px-2 py-0.5 rounded-full font-bold`}
                  >
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/20 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${cat.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-100 dark:text-blue-300 mt-2">
                  {cat.completed} dari {cat.total} sesi
                </p>
              </div>
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
}
