import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StructureClient } from "./StructureClient";

export default async function ManajemenStrukturPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const rawProfile = profile as { id: string; role: string } | null;

  if (!rawProfile || (rawProfile.role !== "admin-or" && rawProfile.role !== "super-admin")) {
    redirect("/dashboard");
  }

  // Fetch all 5 tables to pass to the client component
  const [{ data: periods }, { data: departments }, { data: legacyMembers }, { data: divisions }, { data: orgHistories }] = await Promise.all([
    supabase.from("membership_periods").select("*").order("created_at", { ascending: false }),
    supabase.from("departments").select("*").order("sort_order", { ascending: true }),
    supabase.from("legacy_members").select("*").order("full_name", { ascending: true }),
    supabase.from("divisions").select("*").order("sort_order", { ascending: true }),
    supabase.from("organizational_histories").select(`
      *,
      department:departments(name),
      division:divisions(name),
      period:membership_periods(period_name),
      member:legacy_members(full_name, gender)
    `).order("sort_order", { ascending: true })
  ]);

  return (
    <StructureClient
      initialPeriods={periods || []}
      initialDepartments={departments || []}
      initialLegacyMembers={legacyMembers || []}
      initialDivisions={divisions || []}
      initialOrgHistories={orgHistories || []}
    />
  );
}
