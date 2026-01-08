"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity } from "@/schemas/activities";
import {
  formatActivityDate,
  formatActivityTime,
  getStatusLabel,
  getModeLabel,
} from "@/lib/firebase/services/activity-service";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Laptop,
  Building2,
  Radio,
  Link as LinkIcon,
  User,
  Edit,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================
// TYPES
// =========================================================

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onEdit?: (activity: Activity) => void;
  onDuplicate?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

// =========================================================
// HELPER COMPONENTS
// =========================================================

function StatusBadge({ status }: { status: Activity["status"] }) {
  const statusConfig: Record<
    Activity["status"],
    { bg: string; icon: React.ElementType }
  > = {
    upcoming: {
      bg: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
      icon: Clock,
    },
    ongoing: {
      bg: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
      icon: CheckCircle,
    },
    completed: {
      bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      icon: CheckCircle,
    },
    cancelled: {
      bg: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
      icon: XCircle,
    },
  };

  const { bg, icon: Icon } = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
        bg
      )}
    >
      <Icon className="w-4 h-4" />
      {getStatusLabel(status)}
    </span>
  );
}

function ModeBadge({ mode }: { mode: Activity["mode"] }) {
  const modeConfig: Record<
    Activity["mode"],
    { bg: string; icon: React.ElementType }
  > = {
    online: {
      bg: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
      icon: Laptop,
    },
    offline: {
      bg: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
      icon: Building2,
    },
    hybrid: {
      bg: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
      icon: Radio,
    },
  };

  const { bg, icon: Icon } = modeConfig[mode];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
        bg
      )}
    >
      <Icon className="w-4 h-4" />
      {getModeLabel(mode)}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5 wrap-break-word">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function ActivityDetailModal({
  isOpen,
  onClose,
  activity,
  onEdit,
  onDuplicate,
  onDelete,
}: ActivityDetailModalProps) {
  if (!activity) return null;

  const attendanceRate =
    activity.totalParticipants > 0
      ? Math.round((activity.attendedCount / activity.totalParticipants) * 100)
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <Eye className="w-5 h-5 text-blue-600" />
            Detail Aktivitas
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Informasi lengkap tentang aktivitas recruitment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {activity.title}
            </h2>
            {activity.description && (
              <p className="text-slate-600 dark:text-slate-400">
                {activity.description}
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={activity.status} />
            <ModeBadge mode={activity.mode} />
            {activity.orPeriod && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                <FileText className="w-4 h-4" />
                {activity.orPeriod}
              </span>
            )}
          </div>

          {/* Schedule Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jadwal Pelaksanaan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mulai
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatActivityDate(activity.startDateTime)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formatActivityTime(activity.startDateTime)} WIB
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selesai
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatActivityDate(activity.endDateTime)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formatActivityTime(activity.endDateTime)} WIB
                </p>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(activity.mode === "offline" || activity.mode === "hybrid") && (
              <InfoRow icon={MapPin} label="Lokasi" value={activity.location} />
            )}
            {(activity.mode === "online" || activity.mode === "hybrid") && (
              <InfoRow
                icon={LinkIcon}
                label="Link Meeting"
                value={
                  activity.onlineLink ? (
                    <a
                      href={activity.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                    >
                      {activity.onlineLink}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            )}
          </div>

          {/* Attendance Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Statistik Kehadiran
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {activity.totalParticipants}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total Peserta
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {activity.attendedCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hadir
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {activity.absentCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tidak Hadir
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {activity.totalParticipants > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Tingkat Kehadiran
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {attendanceRate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* Attendance Settings */}
            <div className="flex items-center gap-2 text-sm">
              {activity.attendanceEnabled ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Presensi aktif • Toleransi {activity.lateTolerance || 15}{" "}
                    menit
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">
                    Presensi tidak diaktifkan
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Dibuat oleh: {activity.createdBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Dibuat: {formatActivityDate(activity.createdAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit?.(activity);
                onClose();
              }}
              className="flex items-center gap-2 border-slate-200 dark:border-slate-700"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDuplicate?.(activity);
                onClose();
              }}
              className="flex items-center gap-2 border-slate-200 dark:border-slate-700"
            >
              <Copy className="w-4 h-4" />
              Duplikat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDelete?.(activity);
                onClose();
              }}
              className="flex items-center gap-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-200 dark:border-slate-700"
            >
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
