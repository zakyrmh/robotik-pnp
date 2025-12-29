"use client";

import { CaangData } from "@/lib/firebase/services/caang-service";
import { Heart, Trophy, Quote } from "lucide-react";

interface EssayTabProps {
  caang: CaangData;
}

export function EssayTab({ caang }: EssayTabProps) {
  const { registration } = caang;

  return (
    <div className="space-y-6">
      {/* Motivation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500" />
          Motivasi Mendaftar
        </h4>
        {registration?.motivation ? (
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-8 h-8 text-slate-200 dark:text-slate-700" />
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-6 italic">
              {registration.motivation}
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 text-center">
            <Heart className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">
              Belum ada motivasi yang diisi
            </p>
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Pengalaman
        </h4>
        {registration?.experience ? (
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {registration.experience}
          </p>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 text-center">
            <Trophy className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">
              Belum ada pengalaman yang diisi
            </p>
          </div>
        )}
      </div>

      {/* Achievement */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Prestasi
        </h4>
        {registration?.achievement ? (
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {registration.achievement}
          </p>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 text-center">
            <Trophy className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">
              Belum ada prestasi yang diisi
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
