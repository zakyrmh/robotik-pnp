"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  XCircle,
  ScanQrCode,
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
import Link from "next/link";

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
      const [attendancesData, activitiesData, usersResponse] =
        await Promise.all([getAttendances(), getActivities(), getUsers()]);

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
            activity: activitiesData.find(
              (a) => a.id === attendance.activityId
            ),
            isAbsent: false,
          }));

        // Add absent users for each activity
        const allAttendances: AttendanceWithRelations[] = [
          ...attendancesWithRelations,
        ];

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

  // Calculate absence percentage per user
  const calculateAbsencePercentage = (userId: string) => {
    // Filter activities based on current OR period filter
    const relevantActivities = filterOrPeriod === "all" 
      ? activities 
      : activities.filter(a => a.orPeriod === filterOrPeriod);

    if (relevantActivities.length === 0) return 0;

    // Count how many activities this user was absent
    const absentCount = relevantActivities.filter(activity => {
      const userAttendance = attendances.find(
        a => a.userId === userId && a.activityId === activity.id
      );
      // Consider absent if: no attendance record OR status is ABSENT
      return !userAttendance || userAttendance.status === AttendanceStatus.ABSENT;
    }).length;

    return (absentCount / relevantActivities.length) * 100;
  };

  // Get highlight class based on absence percentage
  const getHighlightClass = (userId: string) => {
    // Only apply highlight when showing all activities and all status
    if (filterActivity !== "all" || filterStatus !== "all") {
      return "";
    }

    const absencePercentage = calculateAbsencePercentage(userId);
    
    if (absencePercentage >= 75) {
      return "bg-red-100 hover:bg-red-200";
    } else if (absencePercentage >= 50) {
      return "bg-yellow-100 hover:bg-yellow-200";
    }
    
    return "";
  };

  // Filter and sort attendances
  const filteredAndSortedAttendances = attendances
    .filter((attendance) => {
      // Search filter (nama caang or NIM)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        attendance.user?.profile?.fullName
          .toLowerCase()
          .includes(searchLower) ||
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

      return (
        matchesSearch && matchesActivity && matchesStatus && matchesOrPeriod
      );
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
          comparison = a.createdAt.toMillis() - b.createdAt.toMillis();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Calculate statistics (excluding PENDING_APPROVAL)
  const statistics = {
    total: filteredAndSortedAttendances.filter(
      (a) => a.status !== AttendanceStatus.PENDING_APPROVAL
    ).length,
    present: filteredAndSortedAttendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT
    ).length,
    late: filteredAndSortedAttendances.filter(
      (a) => a.status === AttendanceStatus.LATE
    ).length,
    excused: filteredAndSortedAttendances.filter(
      (a) => a.status === AttendanceStatus.EXCUSED
    ).length,
    sick: filteredAndSortedAttendances.filter(
      (a) => a.status === AttendanceStatus.SICK
    ).length,
    absent: filteredAndSortedAttendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT
    ).length,
  };


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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Manajemen Absensi
              </h1>
              <p className="text-gray-600">
                Kelola absensi calon anggota pada berbagai aktivitas
              </p>
            </div>
            <div>
              <Link href="/attendance-management/scan-qr">
                <Button className="gap-2">
                  <ScanQrCode className="w-5 h-5" />
                  Scan QR
                </Button>
              </Link>
            </div>
          </div>
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

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
        >
          {/* Total */}
          <Card className="border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.total}
                  </p>
                </div>
                <div className="p-3 bg-gray-200 rounded-full">
                  <Users className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hadir */}
          <Card className="border-green-300 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">
                    Hadir
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {statistics.present}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terlambat */}
          <Card className="border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 mb-1">
                    Terlambat
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {statistics.late}
                  </p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Izin */}
          <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Izin</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {statistics.excused}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <FileText className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sakit */}
          <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">
                    Sakit
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {statistics.sick}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Heart className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alfa */}
          <Card className="border-red-300 bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Alfa</p>
                  <p className="text-2xl font-bold text-red-900">
                    {statistics.absent}
                  </p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <XCircle className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                  ) : filteredAndSortedAttendances.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-gray-500">
                          {searchQuery ||
                          filterActivity !== "all" ||
                          filterStatus !== "all" ||
                          filterOrPeriod !== "all"
                            ? "Tidak ada data absensi yang sesuai dengan filter"
                            : "Belum ada data absensi"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Data rows
                    filteredAndSortedAttendances.map((attendance, idx) => (
                      <TableRow 
                        key={attendance.id}
                        className={attendance.user?.id ? getHighlightClass(attendance.user.id) : ""}
                      >
                        <TableCell>
                          {idx + 1}
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
                            {attendance.status ===
                              AttendanceStatus.PENDING_APPROVAL &&
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
