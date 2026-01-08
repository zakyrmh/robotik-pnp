"use client";

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
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// =========================================================
// TYPES
// =========================================================

interface ActivityCardProps {
  activity: Activity;
  onView?: (activity: Activity) => void;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
  onDuplicate?: (activity: Activity) => void;
}

// =========================================================
// HELPER COMPONENTS
// =========================================================

function StatusBadge({ status }: { status: Activity["status"] }) {
  const statusStyles: Record<Activity["status"], string> = {
    upcoming:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    ongoing:
      "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    completed:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function ModeBadge({ mode }: { mode: Activity["mode"] }) {
  const modeStyles: Record<
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

  const { bg, icon: Icon } = modeStyles[mode];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
        bg
      )}
    >
      <Icon className="w-3 h-3" />
      {getModeLabel(mode)}
    </span>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function ActivityCard({
  activity,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}: ActivityCardProps) {
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-all duration-200 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView?.(activity)}>
              <Eye className="w-4 h-4 mr-2" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(activity)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Aktivitas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(activity)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplikat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(activity)}
              className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <StatusBadge status={activity.status} />
        <ModeBadge mode={activity.mode} />
        {activity.orPeriod && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
            {activity.orPeriod}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>{formatActivityDate(activity.startDateTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>{formatActivityTime(activity.startDateTime)} WIB</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 col-span-2">
          <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="truncate">
            {activity.location || activity.onlineLink || "Belum ditentukan"}
          </span>
        </div>

        {/* Attendance */}
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 col-span-2">
          <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {activity.attendedCount}
            </span>
            {" / "}
            {activity.totalParticipants} hadir
          </span>
        </div>
      </div>
    </div>
  );
}
