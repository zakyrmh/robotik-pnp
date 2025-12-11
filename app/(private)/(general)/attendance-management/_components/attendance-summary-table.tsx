"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity } from "@/types/activities";
import { User } from "@/types/users";
import { AttendanceStatus } from "@/types/enum";
import { exportToCSV } from "@/utils/exportToCSV";
// Kita gunakan tipe Attendance standar, karena data virtual dari parent structure-nya sama
import { Attendance } from "@/types/attendances";

// Interface untuk data yang diterima dari Parent Component
interface AttendanceSummaryTableProps {
  attendancesData: Attendance[]; // Data absensi (termasuk virtual absent)
  activitiesData: Activity[];    // List aktivitas (sudah difilter per recruitment/members)
  usersData: User[];             // List user (sudah difilter per role)
  loading: boolean;
}

// Interface internal untuk state processing
interface UserSummary {
  userId: string;
  fullName: string;
  nim: string;
  // Map ActivityID -> Status Absensi
  attendances: {
    [activityId: string]: AttendanceStatus | null;
  };
  // Statistik Total
  summary: {
    hadir: number;
    telat: number;
    izin: number;
    sakit: number;
    alfa: number;
  };
  absentPercentage: number;
  blacklist: boolean;
}

export default function AttendanceSummaryTable({
  attendancesData,
  activitiesData,
  usersData,
  loading,
}: AttendanceSummaryTableProps) {
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [processing, setProcessing] = useState(false);

  // Effect: Memproses raw data menjadi summary table
  useEffect(() => {
    if (loading) return;
    setProcessing(true);

    try {
      // 1. Urutkan aktivitas berdasarkan tanggal (Lama -> Baru)
      const sortedActivities = [...activitiesData].sort(
        (a, b) => a.startDateTime.toMillis() - b.startDateTime.toMillis()
      );

      // 2. Loop setiap user target
      const summaries: UserSummary[] = usersData.map((user) => {
        const userAttendancesMap: { [key: string]: AttendanceStatus | null } = {};
        const summary = {
          hadir: 0,
          telat: 0,
          izin: 0,
          sakit: 0,
          alfa: 0,
        };

        // 3. Cek status absensi user di setiap aktivitas
        sortedActivities.forEach((activity) => {
          // Cari record absensi yang cocok (ActivityID + UserID)
          const attendance = attendancesData.find(
            (a) => a.userId === user.id && a.activityId === activity.id
          );

          // Jika ada record, pakai statusnya. Jika tidak ada, anggap ALFA.
          // Note: Logic "Virtual Absent" di parent sudah mengcover ini, 
          // tapi kita double check agar aman.
          const status = attendance ? attendance.status : AttendanceStatus.ABSENT;

          userAttendancesMap[activity.id] = status;

          // Hitung Summary
          switch (status) {
            case AttendanceStatus.PRESENT:
              summary.hadir++;
              break;
            case AttendanceStatus.LATE:
              summary.telat++;
              break;
            case AttendanceStatus.EXCUSED:
              summary.izin++;
              break;
            case AttendanceStatus.SICK:
              summary.sakit++;
              break;
            case AttendanceStatus.ABSENT:
            default:
              summary.alfa++;
              break;
          }
        });

        // Hitung Persentase Ketidakhadiran (Alfa)
        const totalActivities = sortedActivities.length;
        const absentPercentage = totalActivities > 0
          ? (summary.alfa / totalActivities) * 100
          : 0;

        return {
          userId: user.id,
          fullName: user.profile?.fullName || "Tanpa Nama",
          nim: user.profile?.nim || "-",
          attendances: userAttendancesMap,
          summary,
          absentPercentage,
          blacklist: user.blacklistInfo?.isBlacklisted || false,
        };
      });

      // 4. Sorting: User "Bermasalah" (Merah/Kuning) di atas, lalu urut nama A-Z
      summaries.sort((a, b) => {
        // Tentukan level highlight: 2=Merah, 1=Kuning, 0=Normal
        const getHighlightLevel = (percent: number) => {
          if (percent >= 75) return 2;
          if (percent >= 50) return 1;
          return 0;
        };

        const levelA = getHighlightLevel(a.absentPercentage);
        const levelB = getHighlightLevel(b.absentPercentage);

        // Sort descending by level (Level 2 paling atas)
        if (levelA !== levelB) {
          return levelB - levelA;
        }

        // Jika level sama, urutkan nama ascending
        return a.fullName.localeCompare(b.fullName);
      });

      setUserSummaries(summaries);
    } catch (error) {
      console.error("Error processing summary table:", error);
    } finally {
      setProcessing(false);
    }
  }, [attendancesData, activitiesData, usersData, loading]);

  // Helper: Warna Baris
  const getRowHighlight = (absentPercentage: number, blacklist: boolean) => {
    if (blacklist) return "bg-slate-900 text-white hover:bg-slate-950"; // Blacklist (Extreme)
    if (absentPercentage >= 75) {
      return "bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30";
    } else if (absentPercentage >= 50) {
      return "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30";
    }
    return "";
  };

  // Helper: Badge Status (Versi Mini untuk Tabel)
  const getStatusBadge = (status: AttendanceStatus | null) => {
    // Menggunakan inisial agar tabel tidak terlalu lebar
    switch (status) {
      case AttendanceStatus.PRESENT:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-green-500 hover:bg-green-600 text-[10px] w-6 h-6 flex items-center justify-center p-0">H</Badge>
              </TooltipTrigger>
              <TooltipContent><p>Hadir</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case AttendanceStatus.LATE:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-[10px] w-6 h-6 flex items-center justify-center p-0">T</Badge>
              </TooltipTrigger>
              <TooltipContent><p>Terlambat</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case AttendanceStatus.EXCUSED:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] w-6 h-6 flex items-center justify-center p-0">I</Badge>
              </TooltipTrigger>
              <TooltipContent><p>Izin</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case AttendanceStatus.SICK:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-purple-500 hover:bg-purple-600 text-[10px] w-6 h-6 flex items-center justify-center p-0">S</Badge>
              </TooltipTrigger>
              <TooltipContent><p>Sakit</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case AttendanceStatus.ABSENT:
      default:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-red-500 hover:bg-red-600 text-[10px] w-6 h-6 flex items-center justify-center p-0">A</Badge>
              </TooltipTrigger>
              <TooltipContent><p>Alfa</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    }
  };

  // Export Logic
  const handleExportCSV = () => {
    // 1. Header CSV
    const headers = [
      "No",
      "Nama",
      "NIM",
      ...activitiesData.map((activity, idx) => `Act-${idx + 1}: ${activity.title}`),
      "Total Hadir",
      "Total Telat",
      "Total Izin",
      "Total Sakit",
      "Total Alfa",
      "Persentase Alfa"
    ];

    // 2. Data Rows
    const data = userSummaries.map((user, idx) => {
      // Map status enum ke text readable
      const getStatusText = (s: AttendanceStatus | null) => {
        if (!s || s === AttendanceStatus.ABSENT) return "Alfa";
        if (s === AttendanceStatus.PRESENT) return "Hadir";
        if (s === AttendanceStatus.LATE) return "Telat";
        if (s === AttendanceStatus.EXCUSED) return "Izin";
        if (s === AttendanceStatus.SICK) return "Sakit";
        return s;
      };

      return [
        idx + 1,
        user.fullName,
        user.nim,
        // Loop aktivitas sesuai urutan activitiesData
        ...activitiesData.map((activity) =>
          getStatusText(user.attendances[activity.id])
        ),
        user.summary.hadir,
        user.summary.telat,
        user.summary.izin,
        user.summary.sakit,
        user.summary.alfa,
        `${user.absentPercentage.toFixed(1)}%`
      ];
    });

    exportToCSV(
      headers,
      data,
      `rekap-absensi-${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  if (loading || processing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <span>Total Peserta: <strong>{userSummaries.length}</strong></span>
          <span>|</span>
          <span>Total Aktivitas: <strong>{activitiesData.length}</strong></span>
        </div>

        <Button onClick={handleExportCSV} className="gap-2" disabled={userSummaries.length === 0}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Legend / Keterangan Warna */}
      <Card className="bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 flex flex-wrap gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-400"></span>
            <span>Kuning: Alfa ≥ 50%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-100 border border-red-400"></span>
            <span>Merah: Alfa ≥ 75%</span>
          </div>
          <div className="flex items-center gap-2 ml-auto text-gray-400 dark:text-gray-500">
            <span>H: Hadir, T: Telat, I: Izin, S: Sakit, A: Alfa</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Sticky Columns */}
                  <TableHead className="sticky left-0 bg-white dark:bg-gray-900 z-20 w-[50px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    No
                  </TableHead>
                  <TableHead className="sticky left-[50px] bg-white dark:bg-gray-900 z-20 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Nama & NIM
                  </TableHead>

                  {/* Activity Columns */}
                  {activitiesData.map((activity, idx) => (
                    <TableHead key={activity.id} className="text-center min-w-[60px] px-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help flex flex-col items-center">
                              <span className="text-[10px] text-gray-400">#{idx + 1}</span>
                              <span className="text-xs truncate max-w-[80px]">
                                {activity.title.split(" ")[0]}...
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="font-semibold">{activity.title}</p>
                            <p className="text-xs">{activity.orPeriod}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  ))}

                  {/* Summary Columns */}
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-800 min-w-[50px] text-red-600 dark:text-red-400 font-bold">Alfa</TableHead>
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-800 min-w-[50px]">Hadir</TableHead>
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-800 min-w-[50px]">Telat</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {userSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activitiesData.length + 6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Belum ada data user atau aktivitas.
                    </TableCell>
                  </TableRow>
                ) : (
                  userSummaries.map((user, idx) => (
                    <TableRow
                      key={user.userId}
                      className={getRowHighlight(user.absentPercentage, user.blacklist)}
                    >
                      {/* Sticky Data */}
                      <TableCell className="sticky left-0 bg-inherit z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] font-medium">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="sticky left-[50px] bg-inherit z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate max-w-[180px]">{user.fullName}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{user.nim}</span>
                        </div>
                      </TableCell>

                      {/* Activity Status Badges */}
                      {activitiesData.map((activity) => (
                        <TableCell key={activity.id} className="text-center px-1">
                          <div className="flex justify-center">
                            {getStatusBadge(user.attendances[activity.id])}
                          </div>
                        </TableCell>
                      ))}

                      {/* Summary Counts */}
                      <TableCell className="text-center font-bold text-red-600 dark:text-red-400 bg-white/30 dark:bg-black/20">
                        {user.summary.alfa}
                      </TableCell>
                      <TableCell className="text-center text-green-700 dark:text-green-400 bg-white/30 dark:bg-black/20">
                        {user.summary.hadir}
                      </TableCell>
                      <TableCell className="text-center text-yellow-700 dark:text-yellow-400 bg-white/30 dark:bg-black/20">
                        {user.summary.telat}
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
  );
}