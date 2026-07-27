import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberDisciplineHeader } from "@/components/features/komdis/member-discipline-header";
import {
  DisciplineHistoryTabs,
  AttendanceHistoryItem,
} from "@/components/features/komdis/discipline-history-tabs";
import { DisciplinePointLog, Sanction } from "@/lib/types/komdis";

export const metadata: Metadata = {
  title: "Detail Kedisiplinan Anggota | UKM Robotik PNP",
  description:
    "Rincian poin kedisiplinan, log pemutihan, dan Surat Peringatan anggota",
};

interface MemberDisciplineDetailPageProps {
  params: Promise<{
    profileId: string;
  }>;
}

export default async function MemberDisciplineDetailPage({
  params,
}: MemberDisciplineDetailPageProps) {
  const { profileId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cek Hak Akses Role Pengakses
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isKomdisAdmin = ["admin-komdis", "super-admin"].includes(
    viewerProfile?.role || "",
  );

  // Jika bukan komdis admin dan bukan profil milik sendiri -> forbidden
  if (!isKomdisAdmin && user.id !== profileId) {
    redirect("/dashboard");
  }

  // Fetch Member Profile
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, full_name, nim, role")
    .eq("id", profileId)
    .single();

  if (!targetProfile) {
    notFound();
  }

  // Fetch Net Points Summary
  const { data: summaryData } = await supabase
    .from("v_user_discipline_summary")
    .select("net_points")
    .eq("profile_id", profileId)
    .single();

  // Fetch Active Sanctions
  const { data: activeSanctions } = await supabase
    .from("sanctions")
    .select("sp_level")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("sp_level", { ascending: false });

  const activeSanctionLevel =
    activeSanctions && activeSanctions.length > 0
      ? activeSanctions[0].sp_level
      : null;

  // Fetch Attendance History
  const { data: rawAttendances } = await supabase
    .from("attendances")
    .select(
      `
      id,
      status,
      approval_status,
      points_awarded,
      check_in_at,
      created_at,
      activities:activity_id (
        title,
        start_date
      )
    `,
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  const attendances: AttendanceHistoryItem[] = (rawAttendances || []).map(
    (item) => {
      const activityData = Array.isArray(item.activities)
        ? item.activities[0]
        : item.activities;
      return {
        id: item.id,
        status: item.status,
        approval_status: item.approval_status,
        points_awarded: item.points_awarded,
        check_in_at: item.check_in_at,
        created_at: item.created_at,
        activity: activityData
          ? { title: activityData.title, start_date: activityData.start_date }
          : null,
      };
    },
  );

  // Fetch Discipline Point Logs (Goro Pemutihan)
  const { data: rawPointLogs } = await supabase
    .from("discipline_point_logs")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  const pointLogs: DisciplinePointLog[] = (rawPointLogs || []).map((l) => ({
    id: l.id,
    profile_id: l.profile_id,
    points: l.points,
    category: l.category,
    description: l.description,
    created_by: l.created_by,
    created_at: l.created_at,
  }));

  // Fetch Sanction History
  const { data: rawSanctions } = await supabase
    .from("sanctions")
    .select("*")
    .eq("profile_id", profileId)
    .order("issued_at", { ascending: false });

  const sanctions: Sanction[] = (rawSanctions || []).map((s) => ({
    id: s.id,
    profile_id: s.profile_id,
    sp_level: s.sp_level,
    points_at_issuance: s.points_at_issuance,
    status: s.status,
    issued_by: s.issued_by,
    issued_at: s.issued_at,
    notes: s.notes,
  }));

  return (
    <div className="space-y-6">
      {/* Tricolor Tech Header Line */}
      <div className="h-1 w-full bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />

      {/* Header Info */}
      <MemberDisciplineHeader
        profileId={profileId}
        fullName={targetProfile.full_name || "Anggota"}
        nim={targetProfile.nim || "-"}
        role={targetProfile.role}
        netPoints={summaryData?.net_points || 0}
        activeSanctionLevel={activeSanctionLevel}
        isKomdisAdmin={isKomdisAdmin}
      />

      {/* History Tabs */}
      <DisciplineHistoryTabs
        attendances={attendances}
        pointLogs={pointLogs}
        sanctions={sanctions}
      />
    </div>
  );
}
