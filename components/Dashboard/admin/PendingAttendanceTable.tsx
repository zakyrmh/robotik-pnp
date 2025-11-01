"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attendance } from "@/types/attendances";
import { Activity } from "@/types/activities";
import { User } from "@/types/users";
import { AttendanceStatus } from "@/types/enum";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getUserById } from "@/lib/firebase/users";
import { getActivityById } from "@/lib/firebase/activities";
import { updateAttendance } from "@/lib/firebase/attendances";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/lib/firebaseConfig";

interface PendingAttendanceTableProps {
  attendances: Attendance[];
  onUpdate?: () => void;
}

interface AttendanceWithDetails extends Attendance {
  user?: User;
  activity?: Activity;
}

export default function PendingAttendanceTable({
  attendances,
  onUpdate,
}: PendingAttendanceTableProps) {
  const [attendancesWithDetails, setAttendancesWithDetails] = useState<
    AttendanceWithDetails[]
  >([]);
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;

  // Get pending approvals
  const pendingAttendances = attendances.filter(
    (attendance) => attendance.status === AttendanceStatus.PENDING_APPROVAL
  );

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const attendancesWithData = await Promise.all(
        pendingAttendances.map(async (attendance) => {
          const userResult = await getUserById(attendance.userId);
          const activity = await getActivityById(attendance.activityId);

          return {
            ...attendance,
            user: userResult.data,
            activity: activity,
          };
        })
      );

      setAttendancesWithDetails(attendancesWithData);
      setLoading(false);
    };

    if (pendingAttendances.length > 0) {
      fetchDetails();
    }
  }, [attendances]);

  const handleApprove = async (attendanceId: string, userNotes?: string) => {
    if (!currentUser) {
      toast.error("Anda harus login terlebih dahulu");
      return;
    }

    try {
      // Determine status based on notes (if contains 'sakit' -> sick, else -> excused)
      const status = userNotes?.toLowerCase().includes("sakit")
        ? AttendanceStatus.SICK
        : AttendanceStatus.EXCUSED;

      await updateAttendance(attendanceId, {
        status,
        needsApproval: false,
        approvedBy: currentUser.uid,
        approvedAt: Timestamp.now(),
        points: status === AttendanceStatus.SICK ? 50 : 50,
      });

      toast.success("Attendance approved successfully");
      onUpdate?.();
    } catch (error) {
      console.error("Error approving attendance:", error);
      toast.error("Failed to approve attendance");
    }
  };

  const handleReject = async (attendanceId: string, reason: string) => {
    if (!currentUser) {
      toast.error("Anda harus login terlebih dahulu");
      return;
    }

    try {
      await updateAttendance(attendanceId, {
        status: AttendanceStatus.ABSENT,
        needsApproval: false,
        approvedBy: currentUser.uid,
        approvedAt: Timestamp.now(),
        rejectionReason: reason,
        points: 0,
      });

      toast.success("Attendance rejected");
      onUpdate?.();
    } catch (error) {
      console.error("Error rejecting attendance:", error);
      toast.error("Failed to reject attendance");
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Attendance Perlu Approval
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {pendingAttendances.length} izin/sakit menunggu approval
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendancesWithDetails.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500"
                  >
                    Tidak ada attendance yang perlu approval
                  </TableCell>
                </TableRow>
              ) : (
                attendancesWithDetails.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell className="font-medium">
                      {attendance.user?.profile?.fullName || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {attendance.activity?.title || "Unknown Activity"}
                    </TableCell>
                    <TableCell>
                      {attendance.createdAt
                        ? format(
                            new Date(attendance.createdAt.seconds * 1000),
                            "dd MMM yyyy"
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {attendance.userNotes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleApprove(attendance.id, attendance.userNotes)
                          }
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleReject(
                              attendance.id,
                              "Ditolak oleh admin"
                            )
                          }
                          className="gap-1"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
