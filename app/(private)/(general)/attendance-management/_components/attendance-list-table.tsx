"use client";

import { useState } from "react";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  XCircle,
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
import { Attendance } from "@/types/attendances";
import { Activity } from "@/types/activities";
import { User } from "@/types/users";
import { AttendanceStatus } from "@/types/enum";
import AttendanceDetailDialog from "@/app/(private)/(general)/attendance-management/_components/attendance-detail-dialog";
import AttendanceEditDialog from "@/app/(private)/(general)/attendance-management/_components/attendance-edit-dialog";
import DeleteAttendanceDialog from "@/app/(private)/(general)/attendance-management/_components/delete-attendance-dialog";
import { motion } from "framer-motion";

// Interface baru untuk menerima data dari parent
export interface AttendanceWithRelations extends Attendance {
  user?: User;
  activity?: Activity;
  isAbsent?: boolean;
}

interface AttendanceListTableProps {
  data: AttendanceWithRelations[]; // Data Absensi + Virtual Absents
  loading: boolean;
  refreshData: () => void;
  currentUserId: string | null;
  // Untuk filter dropdown
  activities: Activity[];
  users: User[];
  activityType: "recruitment" | "internal";
}

type SortField = "userName" | "activityName" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

export default function AttendanceListTable({
  data,
  loading,
  refreshData,
  currentUserId,
  activities,
  activityType,
}: AttendanceListTableProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOrPeriod, setFilterOrPeriod] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Dialogs
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceWithRelations | null>(null);

  // Get unique OR periods from data (bisa dari activities atau attendances)
  const orPeriods = Array.from(
    new Set(activities.map((a) => a.orPeriod))
  ).filter((p): p is string => !!p); // Tambahkan type predicate ': p is string'

  // Calculate absence percentage per user (Helper for Highlight)
  const calculateAbsencePercentage = (userId: string) => {
    // Gunakan prop 'activities' yang sudah difilter oleh parent
    const relevantActivities =
      filterOrPeriod === "all"
        ? activities
        : activities.filter((a) => a.orPeriod === filterOrPeriod);

    if (relevantActivities.length === 0) return 0;

    const absentCount = relevantActivities.filter((activity) => {
      const userAttendance = data.find(
        (a) => a.userId === userId && a.activityId === activity.id
      );
      return (
        !userAttendance || userAttendance.status === AttendanceStatus.ABSENT
      );
    }).length;

    return (absentCount / relevantActivities.length) * 100;
  };

  const getHighlightClass = (userId: string) => {
    if (filterActivity !== "all" || filterStatus !== "all") return "";
    const absencePercentage = calculateAbsencePercentage(userId);
    if (absencePercentage >= 75)
      return "bg-red-100 hover:bg-red-200 dark:bg-red-900/20";
    if (absencePercentage >= 50)
      return "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20";
    return "";
  };

  // Filter Logic
  const filteredAndSortedAttendances = data
    .filter((attendance) => {
      const searchLower = searchQuery.toLowerCase();
      const userName = attendance.user?.profile?.fullName?.toLowerCase() || "";
      const userNim = attendance.user?.profile?.nim?.toLowerCase() || "";

      const matchesSearch =
        !searchQuery ||
        userName.includes(searchLower) ||
        userNim.includes(searchLower);
      const matchesActivity =
        filterActivity === "all" || attendance.activityId === filterActivity;
      const matchesStatus =
        filterStatus === "all" || attendance.status === filterStatus;

      // Filter OR Period (Cek di Activity atau Attendance)
      const attendancePeriod =
        attendance.orPeriod || attendance.activity?.orPeriod;
      const matchesOrPeriod =
        filterOrPeriod === "all" || attendancePeriod === filterOrPeriod;

      // Hide absent users if specific filter is active (optional logic, kept from your original code)
      if (attendance.isAbsent) {
        if (
          filterActivity === "all" ||
          (filterOrPeriod !== "all" && !matchesOrPeriod)
        ) {
          // Logic: Jika filter all activity, jangan tampilkan jutaan virtual absent
          // Kecuali jika memang mau menampilkan list 'Siapa yang absen'
          // Sesuai kode lama: return false;
          // TAPI: Untuk list anggota komdis, kita mungkin mau lihat alfa di tabel utama?
          // Mari kita ikuti logika kode lama untuk keamanan:
          if (filterActivity === "all") return false;
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
          // Handle virtual absent timestamps
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          comparison = timeA - timeB;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Calculate statistics from FILTERED data (excluding Pending)
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

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Helper Badge & Label (sama seperti sebelumnya)
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
        return <Badge className="bg-orange-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
          <CardDescription>
            Kelola absensi untuk{" "}
            {activityType === "recruitment" ? "Caang" : "Anggota"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={
                  activityType === "recruitment"
                    ? "Cari Caang..."
                    : "Cari Anggota..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.values(AttendanceStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter OR Period (Hanya relevan jika ada datanya) */}
            {orPeriods.length > 0 && (
              <Select value={filterOrPeriod} onValueChange={setFilterOrPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  {orPeriods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {/* Total */}
        <Card className="border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
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
                <p className="text-sm font-medium text-green-700 mb-1">Hadir</p>
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
                    >
                      Nama
                      {sortField === "userName" &&
                        (sortOrder === "asc" ? (
                          <ArrowUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-1 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("activityName")}
                    >
                      Aktivitas
                      {sortField === "activityName" &&
                        (sortOrder === "asc" ? (
                          <ArrowUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-1 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAndSortedAttendances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedAttendances.map((attendance, idx) => (
                    <TableRow
                      key={attendance.id}
                      className={
                        attendance.user?.id
                          ? getHighlightClass(attendance.user.id)
                          : ""
                      }
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {attendance.user?.profile?.fullName || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {attendance.user?.profile?.nim || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {attendance.activity?.title || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attendance.orPeriod ||
                              attendance.activity?.orPeriod}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(attendance.status)}
                          {attendance.status ===
                            AttendanceStatus.PENDING_APPROVAL &&
                            attendance.needsApproval && (
                              <span className="text-xs text-orange-600 font-bold">
                                (!)
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
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!attendance.isAbsent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                setSelectedAttendance(attendance);
                                setIsDeleteOpen(true);
                              }}
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

      {/* Dialogs - Pass data users/activities dari props parent */}
      {selectedAttendance && (
        <>
          <AttendanceDetailDialog
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
            attendance={selectedAttendance}
            onSuccess={refreshData}
            currentUserId={currentUserId}
          />
          <AttendanceEditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            attendance={selectedAttendance}
            onSuccess={refreshData}
            currentUserId={currentUserId}
            availableActivities={activities} // PASS DATA DARI PARENT
            availableUsers={data
              .map((d) => d.user!)
              .filter((u, i, arr) => arr.findIndex((t) => t.id === u.id) === i)
              .filter(Boolean)} // Atau pass prop `users`
          />
          <DeleteAttendanceDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            attendance={selectedAttendance}
            onSuccess={refreshData}
            currentUserId={currentUserId}
            userName={selectedAttendance.user?.profile?.fullName}
            activityName={selectedAttendance.activity?.title}
          />
        </>
      )}
    </div>
  );
}
