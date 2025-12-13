
import { ActivityWithAttendance } from "@/lib/firebase/services/presence-service";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns"; // Make sure date-fns is available or use standard JS Date
import { id } from "date-fns/locale"; // Indonesian locale
import { AttendanceStatus } from "@/types/enum";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  item: ActivityWithAttendance;
}

export function ActivityItem({ item }: ActivityItemProps) {
  const { activity, attendance } = item;

  const startDate = activity.startDateTime.toDate();
  const endDate = activity.endDateTime.toDate();
  
  const isUpcoming = activity.status === 'upcoming';
  const isOngoing = activity.status === 'ongoing';

  // Determine status display
  let statusBadge = null;
  let statusColor = "";

  if (attendance) {
    switch (attendance.status) {
      case AttendanceStatus.PRESENT:
        statusBadge = <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-200 dark:border-green-900">Hadir</Badge>;
        statusColor = "border-l-green-500";
        break;
      case AttendanceStatus.LATE:
        statusBadge = <Badge className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-200 dark:border-yellow-900">Terlambat</Badge>;
        statusColor = "border-l-yellow-500";
        break;
      case AttendanceStatus.SICK:
      case AttendanceStatus.EXCUSED:
         statusBadge = <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200 dark:border-blue-900">Izin/Sakit</Badge>;
         statusColor = "border-l-blue-500";
         break;
      case AttendanceStatus.ABSENT:
         statusBadge = <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-200 dark:border-red-900">Tidak Hadir</Badge>;
         statusColor = "border-l-red-500";
         break;
       case AttendanceStatus.PENDING_APPROVAL:
         statusBadge = <Badge variant="outline" className="text-orange-500 border-orange-200">Menunggu Verifikasi</Badge>;
         statusColor = "border-l-orange-500";
         break;
       default: 
         statusBadge = <Badge variant="secondary">{attendance.status}</Badge>;
    }
  } else {
    // No attendance record found
    if (!activity.attendanceEnabled) {
       statusBadge = <Badge variant="secondary" className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Info Only</Badge>;
       statusColor = "border-l-gray-300 dark:border-l-gray-700";
    } else if (isUpcoming) {
      statusBadge = <Badge variant="outline" className="text-muted-foreground">Akan Datang</Badge>;
      statusColor = "border-l-muted";
    } else if (isOngoing) {
         statusBadge = <Badge className="bg-blue-500 animate-pulse">Sedang Berlangsung</Badge>;
         statusColor = "border-l-blue-500";
    } else {
      // Completed/Past but no attendance -> Absent
      statusBadge = <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-200 dark:border-red-900">Alpha</Badge>;
      statusColor = "border-l-red-500";
    }
  }

  return (
    <div className={cn("group bg-card border rounded-xl p-5 hover:shadow-lg transition-all duration-300 border-l-4", statusColor)}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
              {activity.type === 'recruitment' ? 'Open Recruitment' : 'Internal'}
            </span>
             {activity.onlineLink && <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">Online</span>}
          </div>
          
          <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
            {activity.title}
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                {format(startDate, "EEEE, d MMMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
              </span>
            </div>
          </div>
           
           {activity.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
               <MapPin className="w-4 h-4" />
               <span>{activity.location}</span>
            </div>
           )}
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 min-w-[140px]">
          {statusBadge}
          
          {attendance?.points !== undefined && attendance.points > 0 && (
             <span className="text-sm font-medium text-green-600 dark:text-green-400">
                +{attendance.points} Poin
             </span>
          )}
        </div>
      </div>
    </div>
  );
}
