"use client";

import { Search, Filter, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Activity } from "@/schemas/activities";

// =========================================================
// TYPES
// =========================================================

interface AttendanceFiltersBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedActivity: string;
  setSelectedActivity: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedOrPeriod: string;
  setSelectedOrPeriod: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activities: Activity[];
  orPeriods: string[];
}

// =========================================================
// STATUS OPTIONS
// =========================================================

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "excused", label: "Izin" },
  { value: "sick", label: "Sakit" },
  { value: "absent", label: "Alfa" },
];

// =========================================================
// MAIN COMPONENT
// =========================================================

export function AttendanceFiltersBar({
  searchQuery,
  setSearchQuery,
  selectedActivity,
  setSelectedActivity,
  selectedStatus,
  setSelectedStatus,
  selectedOrPeriod,
  setSelectedOrPeriod,
  onRefresh,
  isRefreshing,
  activities,
  orPeriods,
}: AttendanceFiltersBarProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
      {/* Search Input */}
      <div className="relative flex-1 lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama atau NIM..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Activity Filter */}
        <div className="relative">
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="w-full sm:w-48 pl-3 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="">Semua Aktivitas</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-40 pl-10 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* OR Period Filter */}
        <div className="relative">
          <select
            value={selectedOrPeriod}
            onChange={(e) => setSelectedOrPeriod(e.target.value)}
            className="w-full sm:w-36 pl-3 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="">Semua Periode</option>
            {orPeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
          title="Refresh data"
        >
          <RefreshCw
            className={cn("w-4 h-4", isRefreshing && "animate-spin")}
          />
        </button>
      </div>
    </div>
  );
}
