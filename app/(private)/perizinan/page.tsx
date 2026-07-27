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
    "Antrean verifikasi surat izin/sakit Komisi Disiplin UKM Robotik PNP",
};

export default async function PerizinanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cek Hak Akses Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin-komdis", "super-admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Fetch data perizinan
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
      profiles:profile_id (
        full_name,
        nim
      ),
      activities:activity_id (
        title,
        start_date
      )
    `,
    )
    .in("status", ["izin", "sakit"])
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
    <div className="space-y-6">
      {/* Tricolor Tech Header Line */}
      <div className="h-1 w-full bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />

      <LeaveApprovalDashboard initialRequests={requests} />
    </div>
  );
}
