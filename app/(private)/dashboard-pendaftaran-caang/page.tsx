import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCaangDashboardStats } from "@/lib/actions/caang-stats";
import { CaangDashboardClient } from "@/components/features/dashboard-pendaftaran-caang/caang-dashboard-client";

export const metadata = {
  title: "Dashboard Pendaftaran Caang | UKM Robotik PNP",
  description: "Statistik dan analitik pendaftaran calon anggota UKM Robotik PNP",
};

export default async function CaangDashboardPage() {
  const supabase = await createClient();

  // 1. Verify User Session & Role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.role !== "super-admin" && profile.role !== "admin-or")
  ) {
    redirect("/dashboard");
  }

  // 2. Fetch Initial Stats
  const statsResult = await getCaangDashboardStats();

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="p-8 text-center text-destructive font-mono text-sm">
        Gagal memuat statistik pendaftaran Caang. {statsResult.error}
      </div>
    );
  }

  return <CaangDashboardClient initialStats={statsResult.data} />;
}
