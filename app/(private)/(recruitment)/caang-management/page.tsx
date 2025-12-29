"use client";

import { useState, useMemo } from "react";
import {
  useCaangManagement,
  CaangManagementProvider,
} from "./_context/caang-management-context";
import { StatsCards, FiltersBar, CaangTable } from "./_components";
import { PageLoader } from "@/components/ui/page-loader";
import { Users, ShieldAlert } from "lucide-react";

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

  // Show loader
  if (isLoading) {
    return <PageLoader message="Memuat data calon anggota..." />;
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
