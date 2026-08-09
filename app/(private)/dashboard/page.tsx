import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DashboardClient,
  DashboardData,
} from "@/components/features/dashboard/dashboard-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard | UKM Robotik PNP",
  description:
    "Dasbor utama Sistem Manajemen UKM Robotik Politeknik Negeri Padang",
};

interface RawGroupMember {
  caang_groups: {
    name: string;
  } | null;
}

interface RawInternship {
  divisions: {
    name: string;
  } | null;
}

interface RawPiketMember {
  piket_schedules: {
    day: string;
  } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, nim, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Ambil nama dari profiles.full_name (sumber utama, sudah disinkron dari legacy_members).
  // Fallback ke registrations.full_name untuk caang yang belum memiliki nama di profiles.
  let fullName = profile.full_name || "";
  if (!fullName) {
    const { data: registration } = await supabase
      .from("registrations")
      .select("full_name")
      .eq("profile_id", user.id)
      .maybeSingle();
    fullName = registration?.full_name || "Pengguna";
  }

  // Fetch user discipline summary & active sanctions
  const { data: disciplineSummary } = await supabase
    .from("v_user_discipline_summary")
    .select("net_points")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: activeSanctions } = await supabase
    .from("sanctions")
    .select("sp_level")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .order("sp_level", { ascending: false });

  const netPoints = disciplineSummary?.net_points || 0;
  const activeSpLevel =
    activeSanctions && activeSanctions.length > 0
      ? activeSanctions[0].sp_level
      : null;

  const dataPayload: DashboardData = {
    profile: {
      id: profile.id,
      role: profile.role,
      nim: profile.nim,
      fullName,
    },
    discipline: {
      netPoints,
      activeSpLevel,
    },
  };

  if (profile.role === "caang") {
    // 1. Group info
    const { data: groupMember } = await supabase
      .from("group_members")
      .select("caang_groups(name)")
      .eq("profile_id", user.id)
      .maybeSingle();
    const groupName =
      (groupMember as unknown as RawGroupMember)?.caang_groups?.name || null;

    // 2. Division info
    const { data: internship } = await supabase
      .from("internships")
      .select("divisions(name)")
      .eq("profile_id", user.id)
      .maybeSingle();
    const divisionName =
      (internship as unknown as RawInternship)?.divisions?.name || null;

    // 3. Tasks stats
    const { data: tasks } = await supabase.from("tasks").select("id");
    const totalTasks = tasks?.length || 0;

    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("grade, status")
      .eq("profile_id", user.id);
    const submittedTasks = submissions?.length || 0;
    const gradedTasks = submissions?.filter((s) => s.grade !== null) || [];
    const averageGrade =
      gradedTasks.length > 0
        ? gradedTasks.reduce((sum, s) => sum + (s.grade || 0), 0) /
          gradedTasks.length
        : 0;

    // 4. Attendance stats
    const { data: attendances } = await supabase
      .from("attendances")
      .select("status")
      .eq("profile_id", user.id);
    const totalAttendances = attendances?.length || 0;
    const presentCount =
      attendances?.filter((a) => a.status === "hadir" || a.status === "telat")
        .length || 0;

    dataPayload.caangStats = {
      groupName,
      divisionName,
      totalTasks,
      submittedTasks,
      averageGrade: Math.round(averageGrade),
      presentCount,
      totalAttendances,
    };
  } else if (profile.role === "anggota") {
    // 1. Piket assignment
    const { data: piketMembers } = await supabase
      .from("piket_members")
      .select("piket_schedules(day)")
      .eq("profile_id", user.id);
    const piketDays = ((piketMembers as unknown as RawPiketMember[]) || [])
      .map((pm) => pm.piket_schedules?.day)
      .filter(Boolean) as string[];

    const daysMap = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ] as const;
    const todayDayName = daysMap[new Date().getDay()];
    const isScheduledToday = piketDays.includes(todayDayName);

    // 2. Piket reports submitted
    const { count: piketLogsCount } = await supabase
      .from("piket_logs")
      .select("*", { count: "exact", head: true })
      .eq("reported_by", user.id);

    // 3. Attendances count breakdown
    const { data: attendances } = await supabase
      .from("attendances")
      .select("status")
      .eq("profile_id", user.id);

    let hadirCount = 0;
    let telatCount = 0;
    let izinCount = 0;
    let alfaCount = 0;

    attendances?.forEach((a) => {
      if (a.status === "hadir") hadirCount++;
      else if (a.status === "telat") telatCount++;
      else if (a.status === "izin" || a.status === "sakit") izinCount++;
      else if (a.status === "alfa") alfaCount++;
    });

    // 4. Upcoming Activities (limit 3)
    const nowIso = new Date().toISOString();
    const { data: upcomingActs } = await supabase
      .from("activities")
      .select("id, title, start_date, location")
      .gte("end_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(3);

    dataPayload.anggotaStats = {
      piketDays,
      piketLogsCount: piketLogsCount || 0,
      isScheduledToday,
      hadirCount,
      telatCount,
      izinCount,
      alfaCount,
      totalAttendances: attendances?.length || 0,
      upcomingActivities: upcomingActs || [],
    };
  } else if (profile.role === "admin-or") {
    // 1. Caang count
    const { count: totalCaangs } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "caang");

    // 2. Anggota count
    const { count: totalAnggota } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "anggota");

    // 3. Groups count
    const { count: totalGroups } = await supabase
      .from("caang_groups")
      .select("*", { count: "exact", head: true });

    // 4. Pending submissions
    const { count: pendingSubmissions } = await supabase
      .from("task_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "diperiksa");

    // 5. Tasks count
    const { count: totalTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true });

    dataPayload.adminOrStats = {
      totalCaangs: totalCaangs || 0,
      totalAnggota: totalAnggota || 0,
      totalGroups: totalGroups || 0,
      pendingSubmissions: pendingSubmissions || 0,
      totalTasks: totalTasks || 0,
    };
  } else if (profile.role === "admin-komdis") {
    // 1. Pending leave requests (hanya anggota/pengurus aktif, exclude caang & alumni)
    const { count: pendingLeaves } = await supabase
      .from("attendances")
      .select("id, profiles!inner(role)", { count: "exact", head: true })
      .in("status", ["sakit", "izin"])
      .is("verified_by", null)
      .neq("profiles.role", "caang")
      .neq("profiles.role", "alumni");

    // 2. Today's activities
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const { data: todayActivities } = await supabase
      .from("activities")
      .select("id")
      .lte("start_date", endOfToday.toISOString())
      .gte("end_date", startOfToday.toISOString());
    const todayActivitiesCount = todayActivities?.length || 0;

    // 3. Today's attendances
    const todayActivityIds = todayActivities?.map((a) => a.id) || [];
    let todayAttendancesCount = 0;
    if (todayActivityIds.length > 0) {
      const { count } = await supabase
        .from("attendances")
        .select("*", { count: "exact", head: true })
        .in("activity_id", todayActivityIds);
      todayAttendancesCount = count || 0;
    }

    // 4. Active Sanctions count across active members
    const { count: activeSanctionsCount } = await supabase
      .from("sanctions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 5. Piket assignment for admin-komdis (as a member)
    const { data: piketMembers } = await supabase
      .from("piket_members")
      .select("piket_schedules(day)")
      .eq("profile_id", user.id);
    const piketDays = ((piketMembers as unknown as RawPiketMember[]) || [])
      .map((pm) => pm.piket_schedules?.day)
      .filter(Boolean) as string[];

    const daysMap = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ] as const;
    const todayDayName = daysMap[new Date().getDay()];
    const isScheduledToday = piketDays.includes(todayDayName);

    // 6. Piket reports submitted by admin-komdis
    const { count: piketLogsCount } = await supabase
      .from("piket_logs")
      .select("*", { count: "exact", head: true })
      .eq("reported_by", user.id);

    // 7. Upcoming Activities for active members (limit 3)
    const nowIso = new Date().toISOString();
    const { data: upcomingActs } = await supabase
      .from("activities")
      .select("id, title, start_date, location")
      .gte("end_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(3);

    dataPayload.adminKomdisStats = {
      pendingLeaves: pendingLeaves || 0,
      todayActivitiesCount,
      todayAttendancesCount,
      activeSanctionsCount: activeSanctionsCount || 0,
      piketDays,
      piketLogsCount: piketLogsCount || 0,
      isScheduledToday,
      upcomingActivities: upcomingActs || [],
    };
  } else if (profile.role === "super-admin") {
    // 1. Users list by role
    const { data: roleCounts } = await supabase.from("profiles").select("role");

    const superAdminStats = {
      superAdmin: 0,
      adminOr: 0,
      adminKomdis: 0,
      anggota: 0,
      caang: 0,
      totalPiketLogs: 0,
      totalAttendances: 0,
    };

    roleCounts?.forEach((p) => {
      if (p.role === "super-admin") superAdminStats.superAdmin++;
      else if (p.role === "admin-or") superAdminStats.adminOr++;
      else if (p.role === "admin-komdis") superAdminStats.adminKomdis++;
      else if (p.role === "anggota") superAdminStats.anggota++;
      else if (p.role === "caang") superAdminStats.caang++;
    });

    // 2. Piket logs
    const { count: totalPiketLogs } = await supabase
      .from("piket_logs")
      .select("*", { count: "exact", head: true });

    // 3. Attendances count
    const { count: totalAttendances } = await supabase
      .from("attendances")
      .select("*", { count: "exact", head: true });

    superAdminStats.totalPiketLogs = totalPiketLogs || 0;
    superAdminStats.totalAttendances = totalAttendances || 0;

    dataPayload.superAdminStats = superAdminStats;
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient data={dataPayload} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48 w-full rounded-xl bg-slate-200 dark:bg-slate-800 md:col-span-2" />
        <Skeleton className="h-48 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
