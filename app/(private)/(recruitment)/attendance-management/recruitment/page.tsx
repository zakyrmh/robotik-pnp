"use client";

import { useState, useMemo } from "react";
import { ClipboardList, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAttendanceManagement,
  AttendanceManagementProvider,
} from "../_context/attendance-management-context";
import {
  AttendanceStatsCards,
  AttendanceFiltersBar,
  AttendanceTable,
  SummaryRecapTable,
  AttendanceManagementSkeleton,
  AttendanceFormModal,
  AttendanceDetailModal,
} from "../_components";
import { UserAttendanceData } from "@/lib/firebase/services/attendance-service";
import { useDashboard } from "@/components/dashboard/dashboard-context";

// =========================================================
// TAB TYPES
// =========================================================

type TabType = "attendance-list" | "summary-recap";

// =========================================================
// MAIN CONTENT COMPONENT
// =========================================================

function AttendanceManagementContent() {
  const { user } = useDashboard();
  const {
    isLoading,
    isAuthorized,
    activities,
    usersWithAttendance,
    stats,
    orPeriods,
    selectedActivityId,
    setSelectedActivityId,
    refreshData,
    summaries,
  } = useAttendanceManagement();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("attendance-list");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedOrPeriod, setSelectedOrPeriod] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAttendanceData | null>(
    null
  );

  // Handler for refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  // Handler for activity change
  const handleActivityChange = (activityId: string) => {
    setSelectedActivityId(activityId);
  };

  // Filtered data (all users with their attendance status)
  const filteredData = useMemo(() => {
    let result = usersWithAttendance;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.userName.toLowerCase().includes(query) ||
          a.userNim.toLowerCase().includes(query) ||
          a.userId.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatus) {
      result = result.filter((a) => a.status === selectedStatus);
    }

    return result;
  }, [usersWithAttendance, searchQuery, selectedStatus]);

  // Filter activities by OR period
  const filteredActivities = useMemo(() => {
    if (!selectedOrPeriod) return activities;
    return activities.filter((a) => a.orPeriod === selectedOrPeriod);
  }, [activities, selectedOrPeriod]);

  // Handlers for table actions
  const handleViewItem = (item: UserAttendanceData) => {
    setSelectedUser(item);
    setIsDetailModalOpen(true);
  };

  const handleEditItem = (item: UserAttendanceData) => {
    // Open modal for editing or adding (if no record)
    setSelectedUser(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (item: UserAttendanceData) => {
    console.log("Delete item:", item);
    // TODO: Implement delete confirmation
  };

  const handleModalSuccess = async () => {
    await refreshData();
    // No need to close modal here as it's handled in the modal component on success
  };

  // Get current activity details
  const currentActivity = activities.find((a) => a.id === selectedActivityId);

  // Show skeleton loader
  if (isLoading) {
    return <AttendanceManagementSkeleton />;
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
            Admin yang dapat mengakses manajemen presensi.
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
            <ClipboardList className="w-8 h-8 text-blue-600" />
            Presensi Caang
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Kelola data kehadiran calon anggota pada aktivitas recruitment
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("attendance-list")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
            activeTab === "attendance-list"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          Daftar Kehadiran
        </button>
        <button
          onClick={() => setActiveTab("summary-recap")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
            activeTab === "summary-recap"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          Ringkasan & Rekap
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "attendance-list" && (
        <>
          {/* Stats Cards */}
          <AttendanceStatsCards stats={stats} />

          {/* Filters */}
          <AttendanceFiltersBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedActivity={selectedActivityId}
            setSelectedActivity={handleActivityChange}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedOrPeriod={selectedOrPeriod}
            setSelectedOrPeriod={setSelectedOrPeriod}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            activities={filteredActivities}
            orPeriods={orPeriods}
          />

          {/* Attendance Table */}
          <AttendanceTable
            data={filteredData}
            onView={handleViewItem}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        </>
      )}

      {activeTab === "summary-recap" && (
        <SummaryRecapTable activities={activities} summaries={summaries} />
      )}

      {/* Footer Info */}
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {activeTab === "attendance-list"
          ? `Menampilkan ${filteredData.length} caang`
          : `Menampilkan rekap dari ${activities.length} aktivitas untuk ${summaries.length} caang`}
      </div>

      {/* Form Modal */}
      <AttendanceFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        data={selectedUser}
        activityId={selectedActivityId}
        activityOrPeriod={currentActivity?.orPeriod || ""}
        currentUserId={user?.uid || ""}
        onSuccess={handleModalSuccess}
      />

      {/* Detail Modal */}
      <AttendanceDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        data={selectedUser}
        activityTitle={currentActivity?.title || "-"}
      />
    </div>
  );
}

// =========================================================
// PAGE COMPONENT WITH PROVIDER
// =========================================================

export default function AttendanceManagementPage() {
  return (
    <AttendanceManagementProvider>
      <AttendanceManagementContent />
    </AttendanceManagementProvider>
  );
}
