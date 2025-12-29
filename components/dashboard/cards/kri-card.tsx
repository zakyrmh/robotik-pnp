"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { getTeamDisplayName } from "@/schemas/users";
import { Trophy, Wrench, Code, Zap } from "lucide-react";

const technicalRoleIcons = {
  mechanic: Wrench,
  programmer: Code,
  electronics: Zap,
};

const technicalRoleLabels = {
  mechanic: "Mekanik",
  programmer: "Programmer",
  electronics: "Elektro",
};

const managementLabels = {
  chairman: "Ketua Tim",
  vice_chairman: "Wakil Ketua",
  secretary: "Sekretaris",
  treasurer: "Bendahara",
  member: "Anggota",
};

export function KriDashboardCard() {
  const { assignments, hasCompetitionAccess } = useDashboard();

  if (!hasCompetitionAccess || !assignments?.competitions) {
    return null;
  }

  const activeTeams = assignments.competitions.filter((c) => c.isActive);

  if (activeTeams.length === 0) {
    return null;
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
        <Trophy className="w-32 h-32 text-orange-500" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-8 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Kontes Robot Indonesia
          </h2>
        </div>

        {/* Teams Grid */}
        <div className="space-y-3">
          {activeTeams.map((team, index) => {
            const TechIcon = technicalRoleIcons[team.technicalRole];
            return (
              <div
                key={index}
                className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-orange-700 dark:text-orange-400">
                    {getTeamDisplayName(team.team)}
                  </span>
                  <span className="text-xs bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full">
                    {managementLabels[team.managementPosition]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TechIcon className="w-4 h-4" />
                  <span>{technicalRoleLabels[team.technicalRole]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm font-medium">
            Jadwal Latihan
          </button>
          <button className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm font-medium">
            Anggota Tim
          </button>
        </div>
      </div>
    </div>
  );
}
