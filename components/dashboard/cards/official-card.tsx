"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  getDepartmentDisplayName,
  getSubDivisionDisplayName,
  getStructuralDisplayName,
} from "@/schemas/users";
import { Building2, Crown, Users } from "lucide-react";

const positionLabels = {
  coordinator: "Koordinator",
  deputy_coordinator: "Wakil Koordinator",
  head_of_division: "Kepala Bidang",
  deputy_head: "Wakil Kepala Bidang",
  member: "Anggota",
};

export function OfficialDashboardCard() {
  const { assignments, hasDepartmentAccess, hasStructuralAccess, isPresidium } =
    useDashboard();

  // Tidak ada akses departemen atau struktural
  if (!hasDepartmentAccess && !hasStructuralAccess) {
    return null;
  }

  const activeDepartments =
    assignments?.departments?.filter((d) => d.isActive) ?? [];
  const structural = assignments?.structural;

  return (
    <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-sm relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <Building2 className="w-32 h-32 text-purple-500" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-8 bg-purple-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Organisasi
          </h2>
        </div>

        {/* Structural Position (if any) */}
        {hasStructuralAccess && structural && (
          <div className="mb-4 bg-linear-to-r from-purple-100 to-indigo-100 dark:from-purple-950/50 dark:to-indigo-950/50 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Jabatan Struktural
              </span>
            </div>
            <p className="font-bold text-lg text-purple-900 dark:text-purple-100">
              {getStructuralDisplayName(structural.title)}
            </p>
            {isPresidium && (
              <span className="mt-2 inline-block text-xs bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full">
                Presidium
              </span>
            )}
          </div>
        )}

        {/* Departments */}
        {activeDepartments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>Departemen</span>
            </div>
            {activeDepartments.map((dept, index) => (
              <div
                key={index}
                className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-700 dark:text-purple-400">
                    {getDepartmentDisplayName(dept.name)}
                  </span>
                  <span className="text-xs bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full">
                    {positionLabels[dept.position]}
                  </span>
                </div>
                {dept.subDivision && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sub: {getSubDivisionDisplayName(dept.subDivision)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium">
            Dokumen
          </button>
          <button className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium">
            Rapat
          </button>
        </div>
      </div>
    </div>
  );
}
