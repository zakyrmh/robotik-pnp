import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GroupsClient } from "./GroupsClient";

interface RawGroup {
  id: string;
  name: string;
  group_members: {
    profile_id: string;
    profiles: {
      id: string;
      nim: string | null;
      registrations: {
        full_name: string;
      } | null;
    } | null;
  }[] | null;
}

export default async function ManajemenKelompokPage() {
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

  // 1. Get total active Caang count
  const { count: caangCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "caang");

  // 2. Fetch current groups and members
  const { data: groups } = await supabase
    .from("caang_groups")
    .select(`
      id,
      name,
      group_members (
        profile_id,
        profiles (
          id,
          nim,
          registrations (
            full_name
          )
        )
      )
    `)
    .order("name", { ascending: true });

  const formattedGroups = ((groups as unknown as RawGroup[]) || []).map((g) => ({
    id: g.id,
    name: g.name,
    members: (g.group_members || []).map((m) => ({
      profile_id: m.profile_id,
      nim: m.profiles?.nim || "",
      name: m.profiles?.registrations?.full_name || "Calon Anggota",
    })),
  }));

  return (
    <GroupsClient
      caangCount={caangCount || 0}
      initialGroups={formattedGroups}
    />
  );
}
