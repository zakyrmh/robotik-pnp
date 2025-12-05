"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { getAttendances } from "@/lib/firebase/attendances";
import { getActivities } from "@/lib/firebase/activities";
import { getUsers } from "@/lib/firebase/users";
import { Activity } from "@/types/activities";
import { AttendanceStatus } from "@/types/enum";
import { exportToCSV } from "@/utils/exportToCSV";

interface UserSummary {
  userId: string;
  fullName: string;
  nim: string;
  attendances: {
    [activityId: string]: AttendanceStatus | null;
  };
  summary: {
    hadir: number;
    telat: number;
    izin: number;
    sakit: number;
    alfa: number;
  };
  absentPercentage: number;
}

export default function AttendanceSummaryTable() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);

  // Load and process data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [attendancesData, activitiesData, usersResponse] =
          await Promise.all([getAttendances(), getActivities(), getUsers()]);

        if (!usersResponse.success || !usersResponse.data) {
          console.error("Failed to fetch users");
          return;
        }

        // Filter only caang users and sort activities by date
        const caangUsers = usersResponse.data.filter(
          (user) => user.roles.isCaang && !user.deletedAt
        );
        
        const sortedActivities = activitiesData.sort((a, b) => 
          a.startDateTime.toMillis() - b.startDateTime.toMillis()
        );
        
        setActivities(sortedActivities);

        // Process data for each user
        const summaries: UserSummary[] = caangUsers.map((user) => {
          const userAttendances: { [activityId: string]: AttendanceStatus | null } = {};
          const summary = {
            hadir: 0,
            telat: 0,
            izin: 0,
            sakit: 0,
            alfa: 0,
          };

          // Initialize all activities with null (no attendance)
          sortedActivities.forEach((activity) => {
            const attendance = attendancesData.find(
              (a) => a.userId === user.id && a.activityId === activity.id
            );

            if (attendance) {
              userAttendances[activity.id] = attendance.status;
              // Count summary
              switch (attendance.status) {
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
                  summary.alfa++;
                  break;
              }
            } else {
              // No attendance record = absent
              userAttendances[activity.id] = null;
              summary.alfa++;
            }
          });

          // Calculate absent percentage (tidak hadir = tidak ada data ATAU status alfa)
          const totalActivities = sortedActivities.length;
          const absentCount = summary.alfa;
          const absentPercentage = totalActivities > 0 
            ? (absentCount / totalActivities) * 100 
            : 0;

          return {
            userId: user.id,
            fullName: user.profile?.fullName || "-",
            nim: user.profile?.nim || "-",
            attendances: userAttendances,
            summary,
            absentPercentage,
          };
        });

        // Sort by highlight color (no highlight -> yellow -> red), then by name
        summaries.sort((a, b) => {
          // Determine highlight level: 0 = no highlight, 1 = yellow, 2 = red
          const getHighlightLevel = (absentPercentage: number) => {
            if (absentPercentage >= 75) return 2; // red
            if (absentPercentage >= 50) return 1; // yellow
            return 0; // no highlight
          };
          
          const levelA = getHighlightLevel(a.absentPercentage);
          const levelB = getHighlightLevel(b.absentPercentage);
          
          // First sort by highlight level (ascending: no highlight first, red last)
          if (levelA !== levelB) {
            return levelA - levelB;
          }
          
          // Then sort by name within the same highlight level
          return a.fullName.localeCompare(b.fullName);
        });
        
        setUserSummaries(summaries);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get highlight class based on absent percentage
  const getRowHighlight = (absentPercentage: number) => {
    if (absentPercentage >= 75) {
      return "bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30";
    } else if (absentPercentage >= 50) {
      return "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30";
    }
    return "";
  };

  // Get status badge
  const getStatusBadge = (status: AttendanceStatus | null) => {
    if (status === null) {
      return <Badge className="bg-red-500 text-xs">Alfa</Badge>;
    }
    
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <Badge className="bg-green-500 text-xs">Hadir</Badge>;
      case AttendanceStatus.LATE:
        return <Badge className="bg-yellow-500 text-xs">Telat</Badge>;
      case AttendanceStatus.EXCUSED:
        return <Badge className="bg-blue-500 text-xs">Izin</Badge>;
      case AttendanceStatus.SICK:
        return <Badge className="bg-purple-500 text-xs">Sakit</Badge>;
      case AttendanceStatus.ABSENT:
        return <Badge className="bg-red-500 text-xs">Alfa</Badge>;
      case AttendanceStatus.PENDING_APPROVAL:
        return <Badge className="bg-orange-500 text-xs">Pending</Badge>;
      default:
        return <Badge className="text-xs">{status}</Badge>;
    }
  };

  // Get status text for export
  const getStatusText = (status: AttendanceStatus | null) => {
    if (status === null) return "Alfa";
    
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "Hadir";
      case AttendanceStatus.LATE:
        return "Telat";
      case AttendanceStatus.EXCUSED:
        return "Izin";
      case AttendanceStatus.SICK:
        return "Sakit";
      case AttendanceStatus.ABSENT:
        return "Alfa";
      case AttendanceStatus.PENDING_APPROVAL:
        return "Pending";
      default:
        return status;
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Nama",
      "NIM",
      ...activities.map((activity, idx) => `Aktivitas ${idx + 1}`),
      "Hadir",
      "Telat",
      "Izin",
      "Sakit",
      "Alfa",
    ];

    const data = userSummaries.map((user, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        user.fullName,
        user.nim,
        ...activities.map((activity) => 
          getStatusText(user.attendances[activity.id])
        ),
        user.summary.hadir,
        user.summary.telat,
        user.summary.izin,
        user.summary.sakit,
        user.summary.alfa,
      ];
      return row;
    });

    exportToCSV(
      headers,
      data,
      `ringkasan-kehadiran-${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Ringkasan Daftar Kehadiran
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ringkasan kehadiran seluruh calon anggota pada semua aktivitas
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2" disabled={loading}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Keterangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded"></span>
              <span>Highlight kuning: Tidak hadir ≥ 50% dari total aktivitas</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-red-100 border border-red-300 rounded"></span>
              <span>Highlight merah: Tidak hadir ≥ 75% dari total aktivitas</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              * &quot;Tidak hadir&quot; = tidak ada data kehadiran ATAU status alfa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Calon Anggota</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {userSummaries.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Aktivitas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {activities.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">Kehadiran &lt; 50%</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
              {userSummaries.filter((u) => u.absentPercentage >= 50).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-sm text-red-700 dark:text-red-400">Kehadiran &lt; 25%</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              {userSummaries.filter((u) => u.absentPercentage >= 75).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white dark:bg-gray-950 z-10 min-w-[60px]">
                    No
                  </TableHead>
                  <TableHead className="sticky left-[60px] bg-white dark:bg-gray-950 z-10 min-w-[200px]">
                    Nama
                  </TableHead>
                  <TableHead className="sticky left-[260px] bg-white dark:bg-gray-950 z-10 min-w-[120px]">
                    NIM
                  </TableHead>
                  {activities.map((activity, idx) => (
                    <TableHead key={activity.id} className="min-w-[150px] text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">Aktivitas {idx + 1}</span>
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                          {activity.title.length > 20 
                            ? activity.title.substring(0, 20) + "..." 
                            : activity.title}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-900" colSpan={5}>
                    Ringkasan Kehadiran
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white dark:bg-gray-950 z-10"></TableHead>
                  <TableHead className="sticky left-[60px] bg-white dark:bg-gray-950 z-10"></TableHead>
                  <TableHead className="sticky left-[260px] bg-white dark:bg-gray-950 z-10"></TableHead>
                  {activities.map((activity) => (
                    <TableHead key={`sub-${activity.id}`}></TableHead>
                  ))}
                  <TableHead className="text-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    Hadir
                  </TableHead>
                  <TableHead className="text-center bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                    Telat
                  </TableHead>
                  <TableHead className="text-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                    Izin
                  </TableHead>
                  <TableHead className="text-center bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                    Sakit
                  </TableHead>
                  <TableHead className="text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                    Alfa
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="sticky left-0 bg-white dark:bg-gray-950">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="sticky left-[60px] bg-white dark:bg-gray-950">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="sticky left-[260px] bg-white dark:bg-gray-950">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      {activities.map((activity) => (
                        <TableCell key={activity.id}>
                          <Skeleton className="h-6 w-16 mx-auto" />
                        </TableCell>
                      ))}
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : userSummaries.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={activities.length + 8} className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Belum ada data kehadiran
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Data rows
                  userSummaries.map((user, idx) => (
                    <TableRow key={user.userId} className={getRowHighlight(user.absentPercentage)}>
                      <TableCell className="sticky left-0 bg-inherit z-10 font-medium">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="sticky left-[60px] bg-inherit z-10">
                        <div className="font-medium">{user.fullName}</div>
                      </TableCell>
                      <TableCell className="sticky left-[260px] bg-inherit z-10">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.nim}
                        </div>
                      </TableCell>
                      {activities.map((activity) => (
                        <TableCell key={activity.id} className="text-center">
                          {getStatusBadge(user.attendances[activity.id])}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">
                        {user.summary.hadir}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {user.summary.telat}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {user.summary.izin}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {user.summary.sakit}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-red-600 dark:text-red-400">
                        {user.summary.alfa}
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
