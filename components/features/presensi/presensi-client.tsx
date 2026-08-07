"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Calendar03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import {
  PersonalAttendanceTab,
  type HistoryItem,
} from "./personal-attendance-tab";
import { KomdisMemberAttendanceTab } from "./komdis-member-attendance-tab";
import { KomdisActivityAttendanceTab } from "./komdis-activity-attendance-tab";
import type {
  KomdisMemberAttendanceItem,
  KomdisActivitySummaryItem,
} from "@/lib/actions/komdis";

interface PresensiClientProps {
  userRole: string;
  initialPersonalHistory: HistoryItem[];
  initialMemberSummary?: {
    activities: { id: string; title: string; start_date: string }[];
    members: KomdisMemberAttendanceItem[];
  } | null;
  initialActivitySummary?: KomdisActivitySummaryItem[] | null;
}

export function PresensiClient({
  userRole,
  initialPersonalHistory,
  initialMemberSummary,
  initialActivitySummary,
}: PresensiClientProps) {
  const isKomdis = ["admin-komdis", "super-admin"].includes(userRole);
  const [activeTab, setActiveTab] = useState<
    "members" | "activities" | "personal"
  >(isKomdis ? "members" : "personal");

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Header Banner Precision Blueprint */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
        {/* Top Accent Gradient Line (Precision Blueprint 60-30-10 Rule) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316]" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#1e3a8a]/10 text-[#1e3a8a] dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                {isKomdis ? "KOMISI DISIPLIN & REKAP" : "RIWAYAT KEHADIRAN"}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                • LOGS SISTEM
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0a192f] dark:text-slate-50 tracking-tight">
              {isKomdis
                ? "Manajemen & Rekap Presensi"
                : "Presensi Kehadiran Saya"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {isKomdis
                ? "Monitoring rekapitulasi presensi anggota aktif UKM Robotik, analisis kedisiplinan per kegiatan, dan akumulasi poin sanksi."
                : "Daftar riwayat kehadiran dan catatan presensi Anda pada seluruh agenda kegiatan UKM Robotik PNP."}
            </p>
          </div>
        </div>

        {/* Tab Navigation for Komdis & Super Admin */}
        {isKomdis && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeTab === "members"
                  ? "bg-[#1e3a8a] text-white dark:bg-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <HugeiconsIcon icon={UserGroupIcon} size={16} />
              <span>Rekap Per Anggota</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("activities")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeTab === "activities"
                  ? "bg-[#1e3a8a] text-white dark:bg-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={16} />
              <span>Rekap Per Kegiatan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeTab === "personal"
                  ? "bg-[#1e3a8a] text-white dark:bg-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <HugeiconsIcon icon={UserIcon} size={16} />
              <span>Presensi Saya</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content Display */}
      {isKomdis ? (
        <>
          {activeTab === "members" && initialMemberSummary && (
            <KomdisMemberAttendanceTab
              activities={initialMemberSummary.activities}
              members={initialMemberSummary.members}
            />
          )}

          {activeTab === "activities" && initialActivitySummary && (
            <KomdisActivityAttendanceTab activities={initialActivitySummary} />
          )}

          {activeTab === "personal" && (
            <PersonalAttendanceTab initialHistory={initialPersonalHistory} />
          )}
        </>
      ) : (
        <PersonalAttendanceTab initialHistory={initialPersonalHistory} />
      )}
    </div>
  );
}
