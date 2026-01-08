"use client";

import {
  CalendarIcon,
  Clock,
  User,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  UserAttendanceData,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
  getPointsFromStatus,
} from "@/lib/firebase/services/attendance-service";
import { cn } from "@/lib/utils";

interface AttendanceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: UserAttendanceData | null;
  activityTitle: string;
}

export function AttendanceDetailModal({
  open,
  onOpenChange,
  data,
  activityTitle,
}: AttendanceDetailModalProps) {
  if (!data) return null;

  const statusLabel = getAttendanceStatusLabel(data.status);
  const statusColor = getAttendanceStatusColor(data.status);
  const points = getPointsFromStatus(data.status);

  // Native Date formatter
  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date?: Date) => {
    if (!date) return "-";
    return (
      new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date) + " WIB"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detail Presensi</DialogTitle>
          <DialogDescription>
            Informasi lengkap kehadiran untuk anggota ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Section */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                {data.userName}
              </h3>
              <div className="flex flex-col gap-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium">NIM:</span> {data.userNim}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Prodi:</span> {data.userProdi}
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Activity & Status Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Aktivitas
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                {activityTitle}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status Kehadiran
              </p>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  statusColor
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Points Section */}
          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Poin Kehadiran
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {points} Poin
            </span>
          </div>

          {!data.hasAttendanceRecord ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Belum Ada Data Presensi
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                Anggota ini belum melakukan check-in atau data belum diinput
                oleh admin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Check-in Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Tanggal Check-in
                  </div>
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    {formatDate(data.checkedInAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Waktu
                  </div>
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    {formatTime(data.checkedInAt)}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <UserCheck className="w-3.5 h-3.5" />
                  Metode Absen
                </div>
                <p className="text-sm text-slate-900 dark:text-slate-100 capitalize">
                  {data.method === "qr_code"
                    ? "Scan QR Code"
                    : "Input Manual Admin"}
                </p>
              </div>

              {/* Notes */}
              {(data.userNotes || data.adminNotes) && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

                  {data.userNotes && (
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" />
                        Catatan User
                      </div>
                      <p className="text-sm bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md text-slate-700 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                        &quot;{data.userNotes}&quot;
                      </p>
                    </div>
                  )}

                  {data.adminNotes && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" />
                        Catatan Admin
                      </div>
                      <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md text-slate-700 dark:text-slate-300 border border-blue-100 dark:border-blue-800">
                        {data.adminNotes}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
