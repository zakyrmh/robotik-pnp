"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Activity } from "@/schemas/activities";
import {
  getAttendanceStatusLabel,
  getAttendanceStatusShortLabel,
  getAttendanceStatusColor,
  CaangAttendanceSummary,
} from "@/lib/firebase/services/attendance-service";

// =========================================================
// TYPES
// =========================================================

interface SummaryRecapTableProps {
  activities: Activity[];
  summaries: CaangAttendanceSummary[];
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Belum Ada Data Rekap
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
        Rekap kehadiran akan muncul setelah ada aktivitas dan data kehadiran.
      </p>
    </div>
  );
}

// =========================================================
// LEGEND COMPONENT
// =========================================================

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-slate-900 dark:bg-slate-950" />
        <span className="text-slate-600 dark:text-slate-400">
          Blacklist/Non-Aktif
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950/50" />
        <span className="text-slate-600 dark:text-slate-400">Alfa ≥ 75%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950/50" />
        <span className="text-slate-600 dark:text-slate-400">Alfa ≥ 50%</span>
      </div>
      <div className="flex-1" />
      <div className="flex flex-wrap gap-3 text-xs">
        <span>
          <strong>H</strong> = Hadir
        </span>
        <span>
          <strong>T</strong> = Terlambat
        </span>
        <span>
          <strong>I</strong> = Izin
        </span>
        <span>
          <strong>S</strong> = Sakit
        </span>
        <span>
          <strong>A</strong> = Alfa
        </span>
      </div>
    </div>
  );
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function getRowClass(summary: CaangAttendanceSummary) {
  if (summary.isBlacklisted || !summary.isActive) {
    return "bg-slate-900 dark:bg-slate-950 text-slate-100";
  }
  if (summary.absentPercentage >= 75) {
    return "bg-red-100 dark:bg-red-950/50";
  }
  if (summary.absentPercentage >= 50) {
    return "bg-amber-100 dark:bg-amber-950/50";
  }
  return "";
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function SummaryRecapTable({
  activities,
  summaries,
}: SummaryRecapTableProps) {
  if (activities.length === 0 || summaries.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Legend />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                  No
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3 sticky left-10 bg-slate-50 dark:bg-slate-800/50 min-w-[200px] z-10">
                  Nama & NIM
                </th>
                {/* Activity columns */}
                {activities.slice(0, 15).map((activity, index) => (
                  <th
                    key={activity.id}
                    className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-3 min-w-[40px]"
                    title={activity.title}
                  >
                    {index + 1}
                  </th>
                ))}
                <th className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summaries.map((summary, index) => {
                const rowClass = getRowClass(summary);
                const isInactive = summary.isBlacklisted || !summary.isActive;

                return (
                  <tr
                    key={summary.userId}
                    className={cn("transition-colors", rowClass)}
                  >
                    <td
                      className={cn(
                        "px-4 py-3 text-sm sticky left-0 z-10",
                        rowClass || "bg-white dark:bg-slate-900",
                        isInactive
                          ? "text-slate-100"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {index + 1}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 sticky left-10 z-10",
                        rowClass || "bg-white dark:bg-slate-900"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isInactive
                            ? "text-slate-100"
                            : "text-slate-900 dark:text-slate-100"
                        )}
                      >
                        {summary.userName}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          isInactive
                            ? "text-slate-300"
                            : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {summary.userNim}
                      </p>
                    </td>
                    {/* Activity status cells */}
                    {activities.slice(0, 15).map((activity) => {
                      const record = summary.attendanceRecords.find(
                        (r) => r.activityId === activity.id
                      );
                      const status = record?.status || "absent";

                      return (
                        <td key={activity.id} className="px-2 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                              isInactive
                                ? "bg-slate-700 text-slate-300"
                                : getAttendanceStatusColor(status)
                            )}
                            title={getAttendanceStatusLabel(status)}
                          >
                            {getAttendanceStatusShortLabel(status)}
                          </span>
                        </td>
                      );
                    })}
                    <td
                      className={cn(
                        "px-4 py-3 text-center text-sm font-medium",
                        isInactive
                          ? "text-slate-100"
                          : summary.absentPercentage >= 75
                          ? "text-red-700 dark:text-red-400"
                          : summary.absentPercentage >= 50
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-slate-900 dark:text-slate-100"
                      )}
                    >
                      {Math.round(100 - summary.absentPercentage)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
