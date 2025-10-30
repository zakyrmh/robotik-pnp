"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAttendances } from "@/lib/firebase/attendances";
import { getActivities } from "@/lib/firebase/activities";
import { getUsers } from "@/lib/firebase/users";
import { Attendance } from "@/types/attendances";
import { Activity } from "@/types/activities";
import { User } from "@/types/users";
import { AttendanceMethod, AttendanceStatus } from "@/types/enum";
import AttendanceDetailDialog from "@/components/attendances/admin/attendance-detail-dialog";
import AttendanceEditDialog from "@/components/attendances/admin/attendance-edit-dialog";
import DeleteAttendanceDialog from "@/components/attendances/admin/delete-attendance-dialog";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";

type SortField = "userName" | "activityName" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

interface AttendanceWithRelations extends Attendance {
  user?: User;
  activity?: Activity;
  isAbsent?: boolean; // Flag untuk user yang belum absen
}

export default function AttendanceManagementPage() {
  const [attendances, setAttendances] = useState<AttendanceWithRelations[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOrPeriod, setFilterOrPeriod] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Dialog states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceWithRelations | null>(null);

  // Get unique OR periods from attendances
  const orPeriods = Array.from(
    new Set(attendances.map((a) => a.orPeriod))
  ).filter(Boolean);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [attendancesData, activitiesData, usersResponse] = await Promise.all([
        getAttendances(),
        getActivities(),
        getUsers(),
      ]);

      setActivities(activitiesData);

      if (usersResponse.success && usersResponse.data) {
        // Filter only caang users
        const caangUsers = usersResponse.data.filter(
          (user) => user.role === "caang" && !user.deletedAt
        );

        // Map attendances with related data
        const attendancesWithRelations: AttendanceWithRelations[] =
          attendancesData.map((attendance) => ({
            ...attendance,
            user: usersResponse.data?.find((u) => u.id === attendance.userId),
            activity: activitiesData.find((a) => a.id === attendance.activityId),
            isAbsent: false,
          }));

        // Add absent users for each activity
        const allAttendances: AttendanceWithRelations[] = [...attendancesWithRelations];
        
        // For each activity, find users without attendance and add them as absent
        activitiesData.forEach((activity) => {
          const attendedUserIds = attendancesData
            .filter((a) => a.activityId === activity.id)
            .map((a) => a.userId);
          
          const absentUsers = caangUsers.filter(
            (user) => !attendedUserIds.includes(user.id)
          );
          
          // Create virtual attendance records for absent users
          absentUsers.forEach((user) => {
            allAttendances.push({
              id: `absent_${activity.id}_${user.id}`, // Virtual ID
              activityId: activity.id,
              userId: user.id,
              orPeriod: activity.orPeriod,
              status: AttendanceStatus.ABSENT,
              checkedInBy: "",
              method: "manual" as AttendanceMethod,
              needsApproval: false,
              points: 0,
              createdAt: activity.createdAt,
              updatedAt: activity.updatedAt,
              user: user,
              activity: activity,
              isAbsent: true, // Mark as virtual absent record
            });
          });
        });

        setAttendances(allAttendances);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to auth state
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort attendances
  const filteredAndSortedAttendances = attendances
    .filter((attendance) => {
      // Search filter (nama caang or NIM)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        attendance.user?.profile?.fullName.toLowerCase().includes(searchLower) ||
        attendance.user?.profile?.nim.toLowerCase().includes(searchLower);

      // Activity filter
      const matchesActivity =
        filterActivity === "all" || attendance.activityId === filterActivity;

      // Status filter
      const matchesStatus =
        filterStatus === "all" || attendance.status === filterStatus;

      // OR Period filter
      const matchesOrPeriod =
        filterOrPeriod === "all" || attendance.orPeriod === filterOrPeriod;

      // Hide absent users if:
      // 1. Filter activity is "all"
      // 2. Filter OR Period is not "all"
      if (attendance.isAbsent) {
        if (filterActivity === "all" || filterOrPeriod !== "all") {
          return false;
        }
      }

      return matchesSearch && matchesActivity && matchesStatus && matchesOrPeriod;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "userName":
          comparison = (a.user?.profile?.fullName || "").localeCompare(
            b.user?.profile?.fullName || ""
          );
          break;
        case "activityName":
          comparison = (a.activity?.title || "").localeCompare(
            b.activity?.title || ""
          );
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "createdAt":
          comparison =
            a.createdAt.toMillis() - b.createdAt.toMillis();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedAttendances.length / itemsPerPage
  );
  const paginatedAttendances = filteredAndSortedAttendances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterActivity, filterStatus, filterOrPeriod]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <Badge className="bg-green-500">Hadir</Badge>;
      case AttendanceStatus.LATE:
        return <Badge className="bg-yellow-500">Terlambat</Badge>;
      case AttendanceStatus.EXCUSED:
        return <Badge className="bg-blue-500">Izin</Badge>;
      case AttendanceStatus.SICK:
        return <Badge className="bg-purple-500">Sakit</Badge>;
      case AttendanceStatus.ABSENT:
        return <Badge className="bg-red-500">Alfa</Badge>;
      case AttendanceStatus.PENDING_APPROVAL:
        return <Badge className="bg-orange-500">Menunggu Approval</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "Hadir";
      case AttendanceStatus.LATE:
        return "Terlambat";
      case AttendanceStatus.EXCUSED:
        return "Izin";
      case AttendanceStatus.SICK:
        return "Sakit";
      case AttendanceStatus.ABSENT:
        return "Alfa";
      case AttendanceStatus.PENDING_APPROVAL:
        return "Menunggu Approval";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manajemen Absensi
          </h1>
          <p className="text-gray-600">
            Kelola absensi calon anggota pada berbagai aktivitas
          </p>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>
              Gunakan filter untuk mempersempit hasil pencarian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari nama caang atau NIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Activity */}
              <Select value={filterActivity} onValueChange={setFilterActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Aktivitas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aktivitas</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {Object.values(AttendanceStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter OR Period */}
              <Select value={filterOrPeriod} onValueChange={setFilterOrPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Periode OR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode OR</SelectItem>
                  {orPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("userName")}
                        className="flex items-center hover:bg-transparent p-0"
                      >
                        Nama Caang
                        {getSortIcon("userName")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("activityName")}
                        className="flex items-center hover:bg-transparent p-0"
                      >
                        Nama Aktivitas
                        {getSortIcon("activityName")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("status")}
                        className="flex items-center hover:bg-transparent p-0"
                      >
                        Status Absensi
                        {getSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedAttendances.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-gray-500">
                          {searchQuery || filterActivity !== "all" || filterStatus !== "all" || filterOrPeriod !== "all"
                            ? "Tidak ada data absensi yang sesuai dengan filter"
                            : "Belum ada data absensi"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Data rows
                    paginatedAttendances.map((attendance, idx) => (
                      <TableRow key={attendance.id}>
                        <TableCell>
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {attendance.user?.profile?.fullName || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {attendance.user?.profile?.nim || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {attendance.activity?.title || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {attendance.orPeriod}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(attendance.status)}
                            {attendance.status === AttendanceStatus.PENDING_APPROVAL &&
                              attendance.needsApproval && (
                                <span className="text-xs text-orange-600 font-medium">
                                  (Belum Disetujui)
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAttendance(attendance);
                                setIsDetailOpen(true);
                              }}
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAttendance(attendance);
                                setIsEditOpen(true);
                              }}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!attendance.isAbsent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAttendance(attendance);
                                  setIsDeleteOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAndSortedAttendances.length
                  )}{" "}
                  dari {filteredAndSortedAttendances.length} data
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-gray-600">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {selectedAttendance && (
        <>
          <AttendanceDetailDialog
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
            attendance={selectedAttendance}
            onSuccess={loadData}
            currentUserId={currentUserId}
          />

          <AttendanceEditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            attendance={selectedAttendance}
            onSuccess={loadData}
            currentUserId={currentUserId}
          />

          <DeleteAttendanceDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            attendance={selectedAttendance}
            onSuccess={loadData}
            currentUserId={currentUserId}
            userName={selectedAttendance.user?.profile?.fullName}
            activityName={selectedAttendance.activity?.title}
          />
        </>
      )}
    </div>
  );
}