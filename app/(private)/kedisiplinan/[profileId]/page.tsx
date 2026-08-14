import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MemberDisciplineDetailClient,
  AttendanceHistoryItem,
  MemberProfileDetailData,
} from "@/components/features/komdis/member-discipline-detail-client";
import { DisciplinePointLog, Sanction } from "@/lib/types/komdis";

export const metadata: Metadata = {
  title: "Detail & Sanksi Kedisiplinan | UKM Robotik PNP",
  description:
    "Rincian poin kedisiplinan, log pemutihan Goro, dispensasi magang, dan Surat Peringatan anggota",
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

  // Cek Hak Akses Role Pengakses (Hanya super-admin dan admin-komdis)
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isKomdisAdmin = ["admin-komdis", "super-admin"].includes(
    viewerProfile?.role || "",
  );

  if (!isKomdisAdmin) {
    redirect("/dashboard");
  }

  // Fetch Target Member Profile (Termasuk data status magang)
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, nim, role, is_on_internship, internship_start_date, internship_end_date",
    )
    .eq("id", profileId)
    .single();

  if (!targetProfile) {
    notFound();
  }

  // Fetch Net Points Summary
  const { data: summaryData } = await supabase
    .from("v_user_discipline_summary")
    .select("net_points, total_attendance_points, total_log_points")
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

  const memberData: MemberProfileDetailData = {
    id: targetProfile.id,
    full_name: targetProfile.full_name,
    nim: targetProfile.nim,
    role: targetProfile.role,
    is_on_internship: targetProfile.is_on_internship ?? false,
    internship_start_date: targetProfile.internship_start_date ?? null,
    internship_end_date: targetProfile.internship_end_date ?? null,
  };

  return (
    <div className="w-full">
      <MemberDisciplineDetailClient
        member={memberData}
        netPoints={summaryData?.net_points || 0}
        totalAttendancePoints={summaryData?.total_attendance_points || 0}
        totalLogPoints={summaryData?.total_log_points || 0}
        activeSanctionLevel={activeSanctionLevel}
        attendances={attendances}
        pointLogs={pointLogs}
        sanctions={sanctions}
      />
    </div>
  );
}
