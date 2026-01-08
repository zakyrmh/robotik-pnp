"use client";

import { useState, useMemo } from "react";
import {
  useCaangManagement,
  CaangManagementProvider,
} from "./_context/caang-management-context";
import { StatsCards, FiltersBar, CaangTable } from "./_components";
import { Users, ShieldAlert, Loader2 } from "lucide-react";

// =========================================================
// SKELETON LOADING COMPONENT
// =========================================================

function CaangManagementSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-5 w-80 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="ml-auto h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
          >
            <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Memuat data calon anggota...</span>
      </div>
    </div>
  );
}

// =========================================================
// MAIN CONTENT COMPONENT
// =========================================================

function CaangManagementContent() {
  const { isLoading, isAuthorized, caangList } = useCaangManagement();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter data
  const filteredData = useMemo(() => {
    let result = caangList;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const name = c.user.profile?.fullName?.toLowerCase() || "";
        const nim = c.user.profile?.nim?.toLowerCase() || "";
        const email = c.user.email?.toLowerCase() || "";
        return (
          name.includes(query) || nim.includes(query) || email.includes(query)
        );
      });
    }

    // Prodi filter
    if (selectedProdi) {
      result = result.filter((c) => c.user.profile?.major === selectedProdi);
    }

    // Status filter
    if (selectedStatus) {
      if (selectedStatus === "blacklisted") {
        result = result.filter(
          (c) => c.user.blacklistInfo?.isBlacklisted === true
        );
      } else {
        result = result.filter(
          (c) => c.registration?.status === selectedStatus
        );
      }
    }

    return result;
  }, [caangList, searchQuery, selectedProdi, selectedStatus]);

  // Export to Excel
  const handleExport = () => {
    const data = filteredData.map((c) => ({
      "Nama Lengkap": c.user.profile?.fullName || "-",
      NIM: c.user.profile?.nim || "-",
      Email: c.user.email,
      "No. HP": c.user.profile?.phone || "-",
      "Program Studi": c.user.profile?.major || "-",
      Jurusan: c.user.profile?.department || "-",
      "Status Registrasi": c.registration?.status || "-",
      "Status Akun": c.user.isActive ? "Aktif" : "Nonaktif",
      Blacklist: c.user.blacklistInfo?.isBlacklisted ? "Ya" : "Tidak",
    }));

    // Convert to CSV
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-caang-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Show skeleton loader for page-specific data
  if (isLoading) {
    return <CaangManagementSkeleton />;
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Anda tidak memiliki akses ke halaman ini. Hanya Recruiter dan Super
            Admin yang dapat mengakses manajemen calon anggota.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            Manajemen Calon Anggota
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Kelola data dan verifikasi calon anggota baru (Caang)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Filters */}
      <FiltersBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onExport={handleExport}
      />

      {/* Table */}
      <CaangTable
        data={filteredData}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
      />

      {/* Footer Info */}
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Menampilkan {filteredData.length} dari {caangList.length} data
        {selectedIds.length > 0 && (
          <span className="ml-2 text-blue-600 dark:text-blue-400">
            • {selectedIds.length} dipilih
          </span>
        )}
      </div>
    </div>
  );
}

// =========================================================
// PAGE COMPONENT (With Provider)
// =========================================================

export default function CaangManagementPage() {
  return (
    <CaangManagementProvider>
      <CaangManagementContent />
    </CaangManagementProvider>
  );
}
