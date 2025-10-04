// components/attendance/AttendanceTable.tsx
"use client";

import React, { useState, useEffect } from "react";
import { CaangRegistration } from "@/types/caang";
import {
  AttendanceStatus,
  getStatusLabel,
  getStatusColor,
} from "@/types/attendance";
import EditStatusModal from "./EditStatusModal";

export interface AttendanceWithUser {
  id: string;
  userId: string;
  activityId: string;
  status: AttendanceStatus | "alpha";
  userData?: CaangRegistration;
  createdAt?: Date;
  notes?: string;
}

interface AttendanceTableProps {
  attendances: AttendanceWithUser[];
  loading: boolean;
  activities: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  onStatusUpdate: () => void;
}

interface Statistics {
  total: number;
  hadir: number;
  telat: number;
  izin: number;
  sakit: number;
  alpha: number;
}

export default function AttendanceTable({
  attendances,
  loading,
  activities,
  onRefresh,
  onStatusUpdate,
}: AttendanceTableProps) {
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredAttendances, setFilteredAttendances] = useState<
    AttendanceWithUser[]
  >([]);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AttendanceWithUser | null>(
    null
  );

  // Statistics
  const [stats, setStats] = useState<Statistics>({
    total: 0,
    hadir: 0,
    telat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
  });

  // Filter dan search logic
  useEffect(() => {
    let result: AttendanceWithUser[] = [...attendances];

    // Filter by activity
    if (selectedActivity !== "all") {
      result = result.filter((att) => att.activityId === selectedActivity);
    }

    // Search functionality
    if (searchQuery.trim() !== "") {
      const query: string = searchQuery.toLowerCase();
      result = result.filter((att) => {
        const nama: string = att.userData?.namaLengkap?.toLowerCase() || "";
        const nim: string = att.userData?.nim?.toLowerCase() || "";
        const prodi: string = att.userData?.prodi?.toLowerCase() || "";
        const status: string =
          att.status === "alpha"
            ? "alpha"
            : getStatusLabel(att.status as AttendanceStatus).toLowerCase();

        return (
          nama.includes(query) ||
          nim.includes(query) ||
          prodi.includes(query) ||
          status.includes(query)
        );
      });
    }

    // Calculate statistics
    const newStats: Statistics = {
      total: result.length,
      hadir: result.filter((a) => a.status === "present").length,
      telat: result.filter((a) => a.status === "late").length,
      izin: result.filter((a) => a.status === "permission").length,
      sakit: result.filter((a) => a.status === "sick").length,
      alpha: result.filter((a) => a.status === "alpha").length,
    };

    setStats(newStats);
    setFilteredAttendances(result);
  }, [attendances, selectedActivity, searchQuery]);

  const handleEditStatus = (attendance: AttendanceWithUser): void => {
    setSelectedUser(attendance);
    setEditModalOpen(true);
  };

  const handleModalClose = (): void => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleStatusUpdated = (): void => {
    handleModalClose();
    onStatusUpdate();
  };

  const formatDateTime = (date: Date | undefined): string => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "—";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          📋 Daftar Calon Anggota
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-2 text-sm bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats.total}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-green-600 dark:text-green-400">Hadir</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.hadir}
          </p>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/20 rounded-lg p-3">
          <p className="text-xs text-orange-600 dark:text-orange-400">Telat</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.telat}
          </p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">Izin</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.izin}
          </p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-purple-600 dark:text-purple-400">Sakit</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {stats.sakit}
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">Alpha</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">
            {stats.alpha}
          </p>
        </div>
      </div>

      {/* Filter dan Search Section */}
      <div className="mb-6 space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cari Data
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIM, prodi, atau status..."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>

        {/* Info Filter Aktif */}
        {(selectedActivity !== "all" || searchQuery.trim() !== "") && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Filter aktif:</span>
            {selectedActivity !== "all" && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                {activities.find((a) => a.id === selectedActivity)?.name}
              </span>
            )}
            {searchQuery.trim() !== "" && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                Pencarian: &quot;{searchQuery}&quot;
              </span>
            )}
            <button
              onClick={() => {
                setSelectedActivity("all");
                setSearchQuery("");
              }}
              className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Memuat data...
          </p>
        </div>
      ) : filteredAttendances.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          {searchQuery.trim() !== "" || selectedActivity !== "all"
            ? "Tidak ada data yang sesuai dengan filter"
            : "Tidak ada data absensi"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-200 dark:border-slate-700 text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nama</th>
                <th className="px-4 py-3 text-left font-medium">NIM</th>
                <th className="px-4 py-3 text-left font-medium">Prodi</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Waktu</th>
                <th className="px-4 py-3 text-left font-medium">Catatan</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendances.map((att) => (
                <tr
                  key={att.id}
                  className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-4 py-3">
                    {att.userData?.namaLengkap || "Data tidak ditemukan"}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {att.userData?.nim || "—"}
                  </td>
                  <td className="px-4 py-3">{att.userData?.prodi || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        att.status
                      )}`}
                    >
                      {att.status === "alpha"
                        ? "Alpha"
                        : getStatusLabel(att.status as AttendanceStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(att.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {att.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEditStatus(att)}
                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Status Modal */}
      {selectedUser && (
        <EditStatusModal
          isOpen={editModalOpen}
          onClose={handleModalClose}
          attendance={selectedUser}
          onSuccess={handleStatusUpdated}
        />
      )}
    </div>
  );
}
