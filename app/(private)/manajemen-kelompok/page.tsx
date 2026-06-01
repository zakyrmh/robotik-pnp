import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GroupsClient } from "./GroupsClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaangMember {
  profile_id: string;
  nim: string;
  name: string;
}

export interface SubGroup {
  id: string;
  name: string;
  members: CaangMember[];
}

export interface ParentGroup {
  id: string;
  name: string;
  subGroups: SubGroup[];
}

export interface AvailableCaang {
  profile_id: string;
  nim: string;
  name: string;
}

// ─── Raw Supabase types ───────────────────────────────────────────────────────

interface RawProfile {
  id: string;
  nim: string | null;
  registrations: { full_name: string } | null;
}

interface RawMember {
  profile_id: string;
  profiles: RawProfile | null;
}

interface RawGroup {
  id: string;
  name: string;
  parent_id: string | null;
  group_members: RawMember[] | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ManajemenKelompokPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const rawProfile = profile as { id: string; role: string } | null;
  if (
    !rawProfile ||
    (rawProfile.role !== "admin-or" && rawProfile.role !== "super-admin")
  ) {
    redirect("/dashboard");
  }

  // 1. Total active Caang count
  const { count: caangCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "caang");

  // 2. Fetch ALL groups (parents + sub groups) with their members
  const { data: allGroups } = await supabase
    .from("caang_groups")
    .select(
      `
      id,
      name,
      parent_id,
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
    `
    )
    .order("name", { ascending: true });

  const rawGroups = (allGroups as unknown as RawGroup[]) || [];

  // 3. Build hierarchy: parent groups → sub groups
  const parentGroupsMap = new Map<string, ParentGroup>();
  const subGroups: RawGroup[] = [];

  rawGroups.forEach((g) => {
    if (g.parent_id === null) {
      parentGroupsMap.set(g.id, { id: g.id, name: g.name, subGroups: [] });
    } else {
      subGroups.push(g);
    }
  });

  subGroups.forEach((g) => {
    const parent = parentGroupsMap.get(g.parent_id!);
    if (parent) {
      parent.subGroups.push({
        id: g.id,
        name: g.name,
        members: (g.group_members || []).map((m) => ({
          profile_id: m.profile_id,
          nim: m.profiles?.nim || "",
          name: m.profiles?.registrations?.full_name || "Calon Anggota",
        })),
      });
    }
  });

  const parentGroups = Array.from(parentGroupsMap.values());

  // 4. Fetch all caangs with profile data (for manual add)
  const { data: allCaangProfiles } = await supabase
    .from("profiles")
    .select(
      `
      id,
      nim,
      registrations (
        full_name
      )
    `
    )
    .eq("role", "caang")
    .order("nim", { ascending: true });

  const rawCaangs = (
    allCaangProfiles as unknown as {
      id: string;
      nim: string | null;
      registrations: { full_name: string } | null;
    }[]
  ) || [];

  // Collect all profile_ids that are already in a sub group
  const assignedProfileIds = new Set<string>();
  subGroups.forEach((g) => {
    g.group_members?.forEach((m) => assignedProfileIds.add(m.profile_id));
  });

  const availableCaangs: AvailableCaang[] = rawCaangs.map((c) => ({
    profile_id: c.id,
    nim: c.nim || "",
    name: c.registrations?.full_name || "Calon Anggota",
  }));

  return (
    <GroupsClient
      caangCount={caangCount || 0}
      parentGroups={parentGroups}
      availableCaangs={availableCaangs}
      assignedProfileIds={Array.from(assignedProfileIds)}
    />
  );
}
