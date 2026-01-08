"use client";

import { useState, useMemo } from "react";
import {
  useActivityManagement,
  ActivityManagementProvider,
} from "../_context/activity-management-context";
import {
  ActivityCard,
  ActivityFiltersBar,
  ActivityFormModal,
  ActivityDetailModal,
  ActivityDeleteModal,
} from "../_components";
import {
  CalendarClock,
  ShieldAlert,
  Loader2,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
} from "lucide-react";
import { Activity } from "@/schemas/activities";
import { duplicateActivity } from "@/lib/firebase/services/activity-service";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { toast } from "sonner";

// =========================================================
// SKELETON LOADING COMPONENT
// =========================================================

function ActivityManagementSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-5 w-96 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
          >
            {/* Title & Description */}
            <div className="mb-4">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded col-span-2" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded col-span-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Memuat data aktivitas...</span>
      </div>
    </div>
  );
}

// =========================================================
// STATS CARDS COMPONENT
// =========================================================

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// =========================================================
// EMPTY STATE COMPONENT
// =========================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <CalendarClock className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Belum Ada Aktivitas
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
        Belum ada aktivitas recruitment yang dibuat. Klik tombol &quot;Buat
        Aktivitas&quot; untuk membuat aktivitas baru.
      </p>
    </div>
  );
}

// =========================================================
// MAIN CONTENT COMPONENT
// =========================================================

function ActivityManagementContent() {
  const {
    isLoading,
    isAuthorized,
    activities,
    stats,
    deletedCount,
    refreshData,
  } = useActivityManagement();
  const { user } = useDashboard();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  // Filter data
  const filteredActivities = useMemo(() => {
    let result = activities;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((a) => {
        const title = a.title.toLowerCase();
        const description = a.description?.toLowerCase() || "";
        const location = a.location?.toLowerCase() || "";
        return (
          title.includes(query) ||
          description.includes(query) ||
          location.includes(query)
        );
      });
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter((a) => a.status === selectedStatus);
    }

    return result;
  }, [activities, searchQuery, selectedStatus]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const handleCreateNew = () => {
    setSelectedActivity(null);
    setIsFormModalOpen(true);
  };

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsFormModalOpen(true);
  };

  const handleDeleteActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteModalOpen(true);
  };

  const handleDuplicateActivity = async (activity: Activity) => {
    if (!user?.uid) {
      toast.error("User tidak terautentikasi");
      return;
    }

    const result = await duplicateActivity(activity, user.uid);

    if (result.success) {
      toast.success("Aktivitas berhasil diduplikasi");
      refreshData();
    } else {
      toast.error(result.error || "Gagal menduplikasi aktivitas");
    }
  };

  // Form Modal handlers
  const handleFormModalClose = () => {
    setIsFormModalOpen(false);
    setSelectedActivity(null);
  };

  const handleFormModalSuccess = () => {
    refreshData();
  };

  // Detail Modal handlers
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedActivity(null);
  };

  // Delete Modal handlers
  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedActivity(null);
  };

  const handleDeleteModalSuccess = () => {
    refreshData();
  };

  // Show skeleton loader for page-specific data
  if (isLoading) {
    return <ActivityManagementSkeleton />;
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
            Admin yang dapat mengakses manajemen aktivitas recruitment.
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
            <CalendarClock className="w-8 h-8 text-blue-600" />
            Jadwal Aktivitas Recruitment
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Kelola jadwal dan aktivitas open recruitment calon anggota
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={Calendar}
          iconColor="text-slate-600 dark:text-slate-400"
          bgColor="bg-slate-100 dark:bg-slate-800"
        />
        <StatsCard
          title="Akan Datang"
          value={stats.upcoming}
          icon={Clock}
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/50"
        />
        <StatsCard
          title="Berlangsung"
          value={stats.ongoing}
          icon={CalendarCheck}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-950/50"
        />
        <StatsCard
          title="Selesai"
          value={stats.completed}
          icon={CalendarX}
          iconColor="text-slate-500 dark:text-slate-400"
          bgColor="bg-slate-100 dark:bg-slate-800"
        />
      </div>

      {/* Filters */}
      <ActivityFiltersBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        isRefreshing={isRefreshing}
        deletedCount={deletedCount}
      />

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onView={handleViewActivity}
              onEdit={handleEditActivity}
              onDelete={handleDeleteActivity}
              onDuplicate={handleDuplicateActivity}
            />
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Menampilkan {filteredActivities.length} dari {activities.length}{" "}
        aktivitas
      </div>

      {/* Activity Form Modal (Create/Edit) */}
      <ActivityFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormModalClose}
        activity={selectedActivity}
        onSuccess={handleFormModalSuccess}
      />

      {/* Activity Detail Modal (View) */}
      <ActivityDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        activity={selectedActivity}
        onEdit={handleEditActivity}
        onDuplicate={handleDuplicateActivity}
        onDelete={handleDeleteActivity}
      />

      {/* Activity Delete Confirmation Modal */}
      <ActivityDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        activity={selectedActivity}
        onSuccess={handleDeleteModalSuccess}
      />
    </div>
  );
}

// =========================================================
// PAGE COMPONENT (With Provider)
// =========================================================

export default function RecruitmentActivityPage() {
  return (
    <ActivityManagementProvider>
      <ActivityManagementContent />
    </ActivityManagementProvider>
  );
}
