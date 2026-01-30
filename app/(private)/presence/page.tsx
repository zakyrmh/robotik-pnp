"use client";

import { useEffect, useState, useMemo } from "react";
import {
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Stethoscope,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { getRecruitmentActivities } from "@/lib/firebase/services/activity-service";
import {
  getAttendancesByOrPeriod,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
} from "@/lib/firebase/services/attendance-service";
import { getRecruitmentSettings } from "@/lib/firebase/services/settings-service";
import { Activity, ActivityStatus } from "@/schemas/activities";
import { Attendance, AttendanceStatus } from "@/schemas/attendances";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// =========================================================
// TYPES
// =========================================================

interface ActivityWithAttendance extends Activity {
  myAttendance: Attendance | null;
  myStatus: AttendanceStatus;
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  sick: number;
  excused: number;
  absent: number;
  attendanceRate: number;
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const getActivityStatusBadge = (status: ActivityStatus) => {
  switch (status) {
    case "upcoming":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          Akan Datang
        </Badge>
      );
    case "ongoing":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <Timer className="h-3 w-3 mr-1 animate-pulse" />
          Berlangsung
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="secondary"
          className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Selesai
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Dibatalkan
        </Badge>
      );
  }
};

const getAttendanceStatusBadge = (status: AttendanceStatus) => {
  const colorClass = getAttendanceStatusColor(status);
  const label = getAttendanceStatusLabel(status);

  const icons: Record<AttendanceStatus, React.ReactNode> = {
    present: <CheckCircle2 className="h-3 w-3 mr-1" />,
    late: <Timer className="h-3 w-3 mr-1" />,
    sick: <Stethoscope className="h-3 w-3 mr-1" />,
    excused: <FileText className="h-3 w-3 mr-1" />,
    absent: <XCircle className="h-3 w-3 mr-1" />,
    pending_approval: <AlertCircle className="h-3 w-3 mr-1" />,
  };

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} border-0 font-medium px-2.5 py-0.5`}
    >
      {icons[status]}
      {label}
    </Badge>
  );
};

const getModeIcon = (mode: "online" | "offline" | "hybrid") => {
  switch (mode) {
    case "online":
      return <Video className="h-4 w-4 text-blue-500" />;
    case "offline":
      return <MapPin className="h-4 w-4 text-green-500" />;
    case "hybrid":
      return <MapPin className="h-4 w-4 text-purple-500" />;
  }
};

// =========================================================
// SUB-COMPONENTS
// =========================================================

interface StatsCardProps {
  title: string;
  value: number;
  total?: number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  showPercentage?: boolean;
}

function StatsCard({
  title,
  value,
  total,
  icon: Icon,
  iconColor,
  bgColor,
  showPercentage,
}: StatsCardProps) {
  const percentage = total && total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold">{value}</span>
              {showPercentage && total && total > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({percentage}%)
                </span>
              )}
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PresenceChartProps {
  stats: AttendanceStats;
}

function PresenceChart({ stats }: PresenceChartProps) {
  const chartData = [
    {
      label: "Hadir",
      value: stats.present,
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Terlambat",
      value: stats.late,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Sakit",
      value: stats.sick,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Izin",
      value: stats.excused,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Alfa",
      value: stats.absent,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
    },
  ];

  const total = stats.total;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Statistik Kehadiran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
          {chartData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            if (percentage === 0) return null;
            return (
              <div
                key={index}
                className={`${item.color} transition-all`}
                style={{ width: `${percentage}%` }}
                title={`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className={`text-sm font-semibold ${item.textColor}`}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance Rate */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tingkat Kehadiran</span>
            <span className="text-sm font-bold text-primary">
              {stats.attendanceRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={stats.attendanceRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Hadir + Terlambat dari total {stats.total} aktivitas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityCardProps {
  activity: ActivityWithAttendance;
  isExpanded: boolean;
  onToggle: () => void;
}

function ActivityCard({ activity, isExpanded, onToggle }: ActivityCardProps) {
  const isPast =
    activity.status === "completed" || activity.status === "cancelled";

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card
        className={cn(
          "transition-all hover:shadow-md",
          isPast && "opacity-80",
          activity.myStatus === "absent" &&
            isPast &&
            "border-red-200 dark:border-red-800/50",
        )}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {getActivityStatusBadge(activity.status)}
                  {getAttendanceStatusBadge(activity.myStatus)}
                </div>
                <CardTitle className="text-base sm:text-lg line-clamp-1">
                  {activity.title}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatShortDate(activity.startDateTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(activity.startDateTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    {getModeIcon(activity.mode)}
                    {activity.mode === "online"
                      ? "Online"
                      : activity.mode === "offline"
                        ? "Offline"
                        : "Hybrid"}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <Separator />

            {/* Activity Details */}
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Waktu</p>
                  <p className="text-muted-foreground">
                    {formatDate(activity.startDateTime)}
                    <br />
                    {formatTime(activity.startDateTime)} -{" "}
                    {formatTime(activity.endDateTime)} WIB
                  </p>
                </div>
              </div>

              {activity.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Lokasi</p>
                    <p className="text-muted-foreground">{activity.location}</p>
                  </div>
                </div>
              )}

              {activity.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Deskripsi</p>
                    <p className="text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Info */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Status Presensi Saya
              </h4>
              <div className="flex items-center gap-3">
                {getAttendanceStatusBadge(activity.myStatus)}
                {activity.myAttendance?.checkedInAt && (
                  <span className="text-sm text-muted-foreground">
                    Check-in: {formatTime(activity.myAttendance.checkedInAt)}
                  </span>
                )}
              </div>
              {activity.myAttendance?.adminNotes && (
                <p className="text-sm text-muted-foreground mt-2">
                  Catatan: {activity.myAttendance.adminNotes}
                </p>
              )}
              {activity.myStatus === "absent" &&
                activity.status === "completed" && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Anda tidak memiliki catatan kehadiran untuk aktivitas ini.
                  </p>
                )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function PresencePage() {
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityWithAttendance[]>([]);
  const [activePeriod, setActivePeriod] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calculate stats
  const stats = useMemo<AttendanceStats>(() => {
    const completedActivities = activities.filter(
      (a) => a.status === "completed",
    );
    const total = completedActivities.length;
    let present = 0;
    let late = 0;
    let sick = 0;
    let excused = 0;
    let absent = 0;

    completedActivities.forEach((a) => {
      switch (a.myStatus) {
        case "present":
          present++;
          break;
        case "late":
          late++;
          break;
        case "sick":
          sick++;
          break;
        case "excused":
          excused++;
          break;
        case "absent":
          absent++;
          break;
      }
    });

    const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

    return { total, present, late, sick, excused, absent, attendanceRate };
  }, [activities]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;

      setIsLoading(true);
      try {
        // Fetch active period from settings
        const settings = await getRecruitmentSettings();
        const period = settings?.activePeriod || "";
        setActivePeriod(period);

        // Fetch all recruitment activities
        const allActivities = await getRecruitmentActivities();

        // Filter activities by orPeriod
        const periodActivities = period
          ? allActivities.filter((a) => a.orPeriod === period)
          : allActivities;

        // Fetch all attendances for this user in this period
        const allAttendances = period
          ? await getAttendancesByOrPeriod(period)
          : [];

        // Filter attendances for current user
        const myAttendances = allAttendances.filter(
          (a) => a.userId === user.uid,
        );

        // Create a map for quick lookup
        const attendanceMap = new Map<string, Attendance>();
        myAttendances.forEach((a) => {
          attendanceMap.set(a.activityId, a);
        });

        // Combine activities with attendance data
        const activitiesWithAttendance: ActivityWithAttendance[] =
          periodActivities.map((activity) => {
            const myAttendance = attendanceMap.get(activity.id) || null;
            const myStatus: AttendanceStatus = myAttendance
              ? myAttendance.status
              : "absent";

            return {
              ...activity,
              myAttendance,
              myStatus,
            };
          });

        // Sort by date (newest first)
        activitiesWithAttendance.sort(
          (a, b) => b.startDateTime.getTime() - a.startDateTime.getTime(),
        );

        setActivities(activitiesWithAttendance);
      } catch (error) {
        console.error("Error fetching presence data:", error);
        toast.error("Gagal memuat data presensi");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user?.uid]);

  // Separate activities by status
  const upcomingActivities = activities.filter(
    (a) => a.status === "upcoming" || a.status === "ongoing",
  );
  const pastActivities = activities.filter(
    (a) => a.status === "completed" || a.status === "cancelled",
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Memuat data presensi...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="space-y-1 px-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          Presensi Saya
        </h1>
        <p className="text-sm text-muted-foreground">
          Lihat riwayat kehadiran Anda di setiap aktivitas
          {activePeriod && (
            <Badge variant="outline" className="ml-2">
              {activePeriod}
            </Badge>
          )}
        </p>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Aktivitas"
          value={stats.total}
          icon={Calendar}
          iconColor="text-slate-600 dark:text-slate-400"
          bgColor="bg-slate-100 dark:bg-slate-800"
        />
        <StatsCard
          title="Hadir"
          value={stats.present}
          total={stats.total}
          icon={CheckCircle2}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-950/50"
          showPercentage
        />
        <StatsCard
          title="Terlambat"
          value={stats.late}
          total={stats.total}
          icon={Timer}
          iconColor="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-100 dark:bg-amber-950/50"
          showPercentage
        />
        <StatsCard
          title="Sakit"
          value={stats.sick}
          total={stats.total}
          icon={Stethoscope}
          iconColor="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-100 dark:bg-purple-950/50"
          showPercentage
        />
        <StatsCard
          title="Izin"
          value={stats.excused}
          total={stats.total}
          icon={FileText}
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/50"
          showPercentage
        />
        <StatsCard
          title="Alfa"
          value={stats.absent}
          total={stats.total}
          icon={XCircle}
          iconColor="text-red-600 dark:text-red-400"
          bgColor="bg-red-100 dark:bg-red-950/50"
          showPercentage
        />
      </div>

      {/* Chart */}
      {stats.total > 0 && <PresenceChart stats={stats} />}

      {/* Upcoming Activities */}
      {upcomingActivities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Aktivitas Mendatang</h2>
            <Badge variant="secondary">{upcomingActivities.length}</Badge>
          </div>
          <div className="space-y-3">
            {upcomingActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isExpanded={expandedId === activity.id}
                onToggle={() =>
                  setExpandedId(expandedId === activity.id ? null : activity.id)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Activities */}
      {pastActivities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-muted-foreground">
              Riwayat Aktivitas
            </h2>
            <Badge variant="outline">{pastActivities.length}</Badge>
          </div>
          <div className="space-y-3">
            {pastActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isExpanded={expandedId === activity.id}
                onToggle={() =>
                  setExpandedId(expandedId === activity.id ? null : activity.id)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activities.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-4">
              <UserCheck className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Belum ada aktivitas
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Aktivitas dan data presensi akan ditampilkan di sini setelah
              panitia membuat jadwal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
