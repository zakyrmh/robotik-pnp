import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LeaveApprovalDashboard,
  LeaveRequestItem,
} from "@/components/features/komdis/leave-approval-dashboard";

export const metadata: Metadata = {
  title: "Perizinan Komdis | UKM Robotik PNP",
  description:
    "Antrean verifikasi surat izin & sakit Komisi Disiplin UKM Robotik PNP",
};

export default async function PerizinanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce RBAC: Hanya super-admin dan admin-komdis yang berhak mengakses
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin-komdis", "super-admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Fetch data perizinan (hanya untuk anggota aktif dan pengurus, mengabaikan caang & alumni)
  const { data: rawRequests } = await supabase
    .from("attendances")
    .select(
      `
      id,
      activity_id,
      profile_id,
      status,
      approval_status,
      notes,
      proof_url,
      points_awarded,
      rejection_reason,
      created_at,
      profiles!inner (
        full_name,
        nim,
        role
      ),
      activities:activity_id (
        title,
        start_date
      )
    `,
    )
    .in("status", ["izin", "sakit"])
    .neq("profiles.role", "caang")
    .neq("profiles.role", "alumni")
    .order("created_at", { ascending: false });

  // Map to strongly typed LeaveRequestItem array
  const requests: LeaveRequestItem[] = (rawRequests || []).map((item) => {
    const profileData = Array.isArray(item.profiles)
      ? item.profiles[0]
      : item.profiles;
    const activityData = Array.isArray(item.activities)
      ? item.activities[0]
      : item.activities;

    return {
      id: item.id,
      activity_id: item.activity_id,
      profile_id: item.profile_id,
      status: item.status,
      approval_status: item.approval_status,
      notes: item.notes,
      proof_url: item.proof_url,
      points_awarded: item.points_awarded,
      rejection_reason: item.rejection_reason,
      created_at: item.created_at,
      profile: profileData
        ? { full_name: profileData.full_name, nim: profileData.nim }
        : null,
      activity: activityData
        ? { title: activityData.title, start_date: activityData.start_date }
        : null,
    };
  });

  return (
    <div className="w-full">
      <LeaveApprovalDashboard initialRequests={requests} />
    </div>
  );
}
