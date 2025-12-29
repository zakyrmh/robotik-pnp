"use client";

import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { useCaangManagement } from "@/app/(private)/(recruitment)/caang-management/_context/caang-management-context";

interface FiltersBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedProdi: string;
  setSelectedProdi: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  onExport: () => void;
}

export function FiltersBar({
  searchQuery,
  setSearchQuery,
  selectedProdi,
  setSelectedProdi,
  selectedStatus,
  setSelectedStatus,
  onExport,
}: FiltersBarProps) {
  const { refreshData, isLoading, caangList } = useCaangManagement();

  // Get unique prodi from caang list
  const prodiOptions = Array.from(
    new Set(caangList.map((c) => c.user.profile?.major).filter(Boolean))
  ) as string[];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "draft", label: "Draft" },
    { value: "form_submitted", label: "Form Submitted" },
    { value: "form_verified", label: "Form Verified" },
    { value: "documents_uploaded", label: "Dokumen Terupload" },
    { value: "payment_pending", label: "Menunggu Pembayaran" },
    { value: "submitted", label: "Submitted" },
    { value: "verified", label: "Terverifikasi" },
    { value: "rejected", label: "Ditolak" },
    { value: "blacklisted", label: "Blacklist" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIM, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Prodi Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">Semua Prodi</option>
              {prodiOptions.map((prodi) => (
                <option key={prodi} value={prodi}>
                  {prodi}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          {/* Export Button */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
