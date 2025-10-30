"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Attendance } from "@/types/attendances";
import { Activity } from "@/types/activities";
import { User } from "@/types/users";
import { AttendanceStatus, AttendanceMethod } from "@/types/enum";
import { getActivityById } from "@/lib/firebase/activities";
import { getUserById } from "@/lib/firebase/users";
import { updateAttendance, calculatePoints } from "@/lib/firebase/attendances";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar,
  User as UserIcon,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance;
  onSuccess?: () => void;
  currentUserId?: string | null;
}

export default function AttendanceDetailDialog({
  open,
  onOpenChange,
  attendance,
  onSuccess,
  currentUserId,
}: AttendanceDetailDialogProps) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checkedInByUser, setCheckedInByUser] = useState<User | null>(null);
  const [approvedByUser, setApprovedByUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load activity
        const activityData = await getActivityById(attendance.activityId);
        setActivity(activityData);

        // Load user (caang)
        const userResponse = await getUserById(attendance.userId);
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
        }

        // Load checkedInBy user
        if (attendance.checkedInBy) {
          const checkedInByResponse = await getUserById(attendance.checkedInBy);
          if (checkedInByResponse.success && checkedInByResponse.data) {
            setCheckedInByUser(checkedInByResponse.data);
          }
        }

        // Load approvedBy user
        if (attendance.approvedBy) {
          const approvedByResponse = await getUserById(attendance.approvedBy);
          if (approvedByResponse.success && approvedByResponse.data) {
            setApprovedByUser(approvedByResponse.data);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open, attendance]);

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
        return <Badge className="bg-orange-500">Menunggu Persetujuan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMethodLabel = (method: AttendanceMethod) => {
    switch (method) {
      case AttendanceMethod.QR_CODE:
        return "QR Code";
      case AttendanceMethod.MANUAL:
        return "Manual";
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Absensi</DialogTitle>
            <DialogDescription>Memuat data...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Absensi</DialogTitle>
          <DialogDescription>
            Informasi lengkap mengenai absensi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informasi Aktivitas
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Nama Aktivitas:</span>
                <span className="col-span-2 font-medium">
                  {activity?.title || "-"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Periode OR:</span>
                <span className="col-span-2 font-medium">
                  {attendance.orPeriod}
                </span>
              </div>
              {activity?.startDateTime && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-gray-600">Waktu:</span>
                  <span className="col-span-2 font-medium">
                    {format(
                      activity.startDateTime.toDate(),
                      "dd MMMM yyyy, HH:mm",
                      { locale: localeId }
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* User Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Informasi Caang
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Nama:</span>
                <span className="col-span-2 font-medium">
                  {user?.profile?.fullName || "-"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">NIM:</span>
                <span className="col-span-2 font-medium">
                  {user?.profile?.nim || "-"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Prodi:</span>
                <span className="col-span-2 font-medium">
                  {user?.profile?.major || "-"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Attendance Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Informasi Absensi
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="col-span-2">{getStatusBadge(attendance.status)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Poin:</span>
                <span className="col-span-2 font-medium">{attendance.points}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Metode Check-in:</span>
                <span className="col-span-2 font-medium">
                  {getMethodLabel(attendance.method)}
                </span>
              </div>
              {attendance.checkedInAt && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-gray-600">Waktu Check-in:</span>
                  <span className="col-span-2 font-medium">
                    {format(
                      attendance.checkedInAt.toDate(),
                      "dd MMMM yyyy, HH:mm:ss",
                      { locale: localeId }
                    )}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Check-in Oleh:</span>
                <span className="col-span-2 font-medium">
                  {checkedInByUser?.profile?.fullName || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(attendance.userNotes || attendance.adminNotes) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Catatan
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {attendance.userNotes && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Catatan User:
                      </span>
                      <p className="text-sm bg-white p-3 rounded border">
                        {attendance.userNotes}
                      </p>
                    </div>
                  )}
                  {attendance.adminNotes && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Catatan Admin:
                      </span>
                      <p className="text-sm bg-white p-3 rounded border">
                        {attendance.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Approval Info (for EXCUSED/SICK) */}
          {(attendance.status === AttendanceStatus.EXCUSED ||
            attendance.status === AttendanceStatus.SICK ||
            attendance.status === AttendanceStatus.PENDING_APPROVAL) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {attendance.approvedAt ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : attendance.rejectionReason ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  )}
                  Informasi Persetujuan
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {attendance.needsApproval && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="col-span-2">
                        <Badge className="bg-orange-500">Menunggu Persetujuan</Badge>
                      </span>
                    </div>
                  )}
                  {!attendance.needsApproval && attendance.approvedAt && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className="col-span-2">
                          <Badge className="bg-green-500">Disetujui</Badge>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm text-gray-600">Disetujui Oleh:</span>
                        <span className="col-span-2 font-medium">
                          {approvedByUser?.profile?.fullName || "-"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm text-gray-600">Tanggal Disetujui:</span>
                        <span className="col-span-2 font-medium">
                          {format(
                            attendance.approvedAt.toDate(),
                            "dd MMMM yyyy, HH:mm",
                            { locale: localeId }
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  {attendance.rejectionReason && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Alasan Penolakan:
                      </span>
                      <p className="text-sm bg-red-50 p-3 rounded border border-red-200 text-red-900">
                        {attendance.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Approval Actions for PENDING_APPROVAL */}
        {attendance.status === AttendanceStatus.PENDING_APPROVAL &&
          attendance.needsApproval && (
            <DialogFooter className="mt-6">
              <div className="flex gap-2 w-full justify-end">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={approving || rejecting}
                  className="text-red-600 hover:text-red-700"
                >
                  {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Tolak
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approving || rejecting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Setujui
                </Button>
              </div>
            </DialogFooter>
          )}
      </DialogContent>
    </Dialog>
  );

  async function handleApprove() {
    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setApproving(true);
    try {
      // Determine the original status from userNotes or default to SICK
      let approvedStatus = AttendanceStatus.SICK;
      
      // Check userNotes to determine if it's SICK or EXCUSED
      if (attendance.userNotes) {
        const notesLower = attendance.userNotes.toLowerCase();
        if (notesLower.includes("izin") || notesLower.includes("excused")) {
          approvedStatus = AttendanceStatus.EXCUSED;
        }
      }
      
      // If status is already set to one of these, use it
      if (attendance.status === AttendanceStatus.SICK) {
        approvedStatus = AttendanceStatus.SICK;
      } else if (attendance.status === AttendanceStatus.EXCUSED) {
        approvedStatus = AttendanceStatus.EXCUSED;
      }

      const updateData: Partial<Attendance> = {
        status: approvedStatus,
        needsApproval: false,
        approvedBy: currentUserId,
        approvedAt: Timestamp.now(),
        points: calculatePoints(approvedStatus),
      };

      await updateAttendance(attendance.id, updateData);
      
      toast.success(`Absensi ${approvedStatus === AttendanceStatus.SICK ? 'sakit' : 'izin'} berhasil disetujui`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error approving attendance:", error);
      toast.error("Gagal menyetujui absensi");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setRejecting(true);
    try {
      const updateData: Partial<Attendance> = {
        status: AttendanceStatus.ABSENT,
        needsApproval: false,
        rejectionReason: "Ditolak oleh admin",
        points: calculatePoints(AttendanceStatus.ABSENT),
      };

      await updateAttendance(attendance.id, updateData);
      
      toast.success("Absensi berhasil ditolak, status diubah menjadi Alfa");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting attendance:", error);
      toast.error("Gagal menolak absensi");
    } finally {
      setRejecting(false);
    }
  }
}