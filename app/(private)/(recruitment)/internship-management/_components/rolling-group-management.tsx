"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaangData } from "@/lib/firebase/services/caang-service";
import {
  RollingInternshipRegistration,
  DepartmentInternshipRegistration,
  RollingInternshipSchedule,
} from "@/schemas/internship";
import { KriTeam, getTeamDisplayName } from "@/schemas/users";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { internshipService } from "@/lib/firebase/services/internship-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  Briefcase,
  Wand2,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// =========================================================
// TYPES
// =========================================================

interface InternshipCaangData extends CaangData {
  rollingRegistration: RollingInternshipRegistration | null;
  departmentRegistration: DepartmentInternshipRegistration | null;
  internshipStatus: "none" | "rolling_only" | "department_only" | "completed";
}

interface RollingGroupProps {
  data: InternshipCaangData[];
}

const DIVISION_KEYS: KriTeam[] = [
  "krai",
  "krsbi_b",
  "krsbi_h",
  "krsti",
  "krsri",
];

// =========================================================
// COMPONENT
// =========================================================

export function RollingGroupManagement({ data }: RollingGroupProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<RollingInternshipSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [internshipStartDate, setInternshipStartDate] = useState<
    Date | undefined
  >(undefined);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Fetch existing schedules and config from Firestore
  const fetchSchedules = async () => {
    try {
      setIsLoadingSchedules(true);
      const [result, config] = await Promise.all([
        internshipService.getAllRollingSchedules(),
        internshipService.getRollingScheduleConfig(),
      ]);
      setSchedules(result);
      setIsScheduleVisible(config?.isScheduleVisible ?? false);
      setInternshipStartDate(config?.internshipStartDate);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Gagal memuat jadwal rolling.");
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Toggle visibility
  const handleToggleVisibility = async (checked: boolean) => {
    if (!user) return;
    setIsTogglingVisibility(true);
    try {
      await internshipService.updateRollingScheduleConfig(
        { isScheduleVisible: checked },
        user.uid,
      );
      setIsScheduleVisible(checked);
      toast.success(
        checked
          ? "Jadwal sekarang terlihat oleh caang."
          : "Jadwal disembunyikan dari caang.",
      );
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Gagal mengubah visibilitas jadwal.");
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // Update Start Date
  const handleUpdateDate = async (date: Date | undefined) => {
    if (!user || !date) return;
    setIsUpdatingDate(true);
    try {
      await internshipService.updateRollingScheduleConfig(
        { internshipStartDate: date },
        user.uid,
      );
      setInternshipStartDate(date);
      toast.success(
        `Tanggal mulai magang berhasil diatur ke ${format(date, "PPP", { locale: localeId })}`,
      );
    } catch (error) {
      console.error("Error updating start date:", error);
      toast.error("Gagal memperbarui tanggal mulai.");
    } finally {
      setIsUpdatingDate(false);
    }
  };

  // Build user lookup map: userId -> InternshipCaangData
  const userMap = useMemo(() => {
    const map: Record<string, InternshipCaangData> = {};
    data.forEach((d) => {
      map[d.user.id] = d;
    });
    return map;
  }, [data]);

  // Build the schedule view: division -> week -> { userId, userData }[]
  const totalWeeks = useMemo(() => {
    if (schedules.length === 0) return 3;
    return Math.max(...schedules.map((s) => s.totalWeeks));
  }, [schedules]);

  const scheduleView = useMemo(() => {
    // Initialize structure: division -> week -> users[]
    const result: Record<
      string,
      Record<number, { userId: string; userData: InternshipCaangData | null }[]>
    > = {};

    DIVISION_KEYS.forEach((div) => {
      result[div] = {};
      for (let w = 1; w <= totalWeeks; w++) {
        result[div][w] = [];
      }
    });

    // Fill from actual schedules
    schedules.forEach((schedule) => {
      const userData = userMap[schedule.userId] || null;

      schedule.weeks.forEach((week) => {
        week.divisions.forEach((division) => {
          if (result[division] && result[division][week.weekNumber]) {
            result[division][week.weekNumber].push({
              userId: schedule.userId,
              userData,
            });
          }
        });
      });
    });

    return result;
  }, [schedules, userMap, totalWeeks]);

  // Stats
  const stats = useMemo(() => {
    const registered = data.filter((d) => d.rollingRegistration).length;
    const scheduled = schedules.length;
    const active = schedules.filter(
      (s) => s.scheduleStatus === "active",
    ).length;
    const draft = schedules.filter((s) => s.scheduleStatus === "draft").length;
    return { registered, scheduled, active, draft };
  }, [data, schedules]);

  // Generate all schedules
  const handleGenerate = async () => {
    if (!internshipStartDate) {
      toast.error("Silakan atur tanggal mulai magang terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await internshipService.generateAllRollingSchedules(
        2,
        internshipStartDate,
      );
      toast.success(
        `Jadwal berhasil di-generate! ${result.generated} baru, ${result.skipped} sudah ada.`,
      );
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} error terjadi.`);
        console.error("Schedule generation errors:", result.errors);
      }
      await fetchSchedules();
    } catch (error) {
      console.error("Error generating schedules:", error);
      toast.error("Gagal generate jadwal.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Activate all draft schedules
  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const activated = await internshipService.activateAllSchedules();
      toast.success(`${activated} jadwal diaktifkan!`);
      await fetchSchedules();
    } catch (error) {
      console.error("Error activating schedules:", error);
      toast.error("Gagal mengaktifkan jadwal.");
    } finally {
      setIsActivating(false);
    }
  };

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Jadwal Rotasi Divisi
          </h2>
          <p className="text-sm text-muted-foreground">
            Atur tanggal mulai dan ketersediaan jadwal untuk peserta.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Start Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 font-normal text-xs justify-start gap-2",
                    !internshipStartDate && "text-muted-foreground",
                  )}
                  disabled={isUpdatingDate}
                >
                  {internshipStartDate ? (
                    format(internshipStartDate, "dd MMM yyyy", {
                      locale: localeId,
                    })
                  ) : (
                    <span>Pilih Tanggal Mulai</span>
                  )}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={internshipStartDate}
                  onSelect={handleUpdateDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
            {isScheduleVisible ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
            <Label
              htmlFor="schedule-visibility"
              className="text-sm font-medium cursor-pointer select-none"
            >
              {isScheduleVisible ? "Terlihat" : "Tersembunyi"}
            </Label>
            <Switch
              id="schedule-visibility"
              checked={isScheduleVisible}
              onCheckedChange={handleToggleVisibility}
              disabled={isTogglingVisibility}
            />
          </div>

          <div className="h-6 w-px bg-border" />

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedules}
            disabled={isLoadingSchedules}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isLoadingSchedules ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || stats.registered === 0}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-1.5" />
            )}
            Generate Jadwal
          </Button>
          {stats.draft > 0 && (
            <Button size="sm" onClick={handleActivate} disabled={isActivating}>
              {isActivating ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1.5" />
              )}
              Aktifkan ({stats.draft})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.registered}</p>
              <p className="text-xs text-muted-foreground">Terdaftar</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
              <p className="text-xs text-muted-foreground">Dijadwalkan</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.draft}</p>
              <p className="text-xs text-muted-foreground">Draft</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Schedule Grid */}
      {isLoadingSchedules ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat jadwal...</span>
        </div>
      ) : schedules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Belum Ada Jadwal</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Klik tombol &quot;Generate Jadwal&quot; untuk membuat jadwal
              rotasi otomatis berdasarkan pilihan divisi yang dipilih oleh caang
              saat pendaftaran.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {DIVISION_KEYS.map((division) => (
            <Card key={division} className="flex flex-col h-full">
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900 border-b">
                <CardTitle className="text-base font-bold text-center flex items-center justify-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  {getTeamDisplayName(division)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-4 space-y-6">
                    {weeks.map((week) => (
                      <div key={week} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-600 border-slate-200 gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            Minggu {week}
                          </Badge>

                          {/* Display Date Range in Admin View */}
                          {schedules[0]?.weeks.find(
                            (w) => w.weekNumber === week,
                          )?.startDate && (
                            <span className="text-[10px] text-muted-foreground bg-slate-50 border px-1.5 py-0.5 rounded">
                              {format(
                                new Date(
                                  schedules[0].weeks.find(
                                    (w) => w.weekNumber === week,
                                  )!.startDate!,
                                ),
                                "dd/MM",
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(
                                  schedules[0].weeks.find(
                                    (w) => w.weekNumber === week,
                                  )!.endDate!,
                                ),
                                "dd/MM",
                              )}
                            </span>
                          )}

                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {scheduleView[division]?.[week]?.length || 0}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {!scheduleView[division]?.[week]?.length ? (
                            <div className="text-xs text-center py-4 text-muted-foreground italic bg-card rounded border border-dashed">
                              Tidak ada jadwal
                            </div>
                          ) : (
                            scheduleView[division][week].map((entry) => (
                              <div
                                key={entry.userId}
                                className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                              >
                                <Avatar className="h-8 w-8 border">
                                  <AvatarImage
                                    src={
                                      entry.userData?.user.profile?.photoUrl ||
                                      undefined
                                    }
                                  />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {entry.userData?.user.profile?.fullName
                                      ?.substring(0, 2)
                                      .toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate leading-none mb-1">
                                    {entry.userData?.user.profile?.fullName ||
                                      "Tanpa Nama"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {entry.userData?.user.profile?.nim || "-"}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
