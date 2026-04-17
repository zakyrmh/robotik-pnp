"use server";

import { createClient } from "@/lib/supabase/server";
import { requireModule, ok, fail } from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";

export interface CaangMagangRow {
  user_id: string;
  full_name: string;
  email: string;
  has_registered: boolean;
  is_manual: boolean;
  status: "unregistered" | "pending" | "approved" | "rejected";
  submitted_at: string | null;
}

export async function getMagangDatabaseData(): Promise<
  ActionResult<CaangMagangRow[]>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if ("error" in auth && !("userId" in auth)) return fail(auth.error!);

    const supabase = await createClient();

    // 1. Get CAANG role ID
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "caang")
      .single();
    if (!roleData) return fail("Role Caang tidak ditemukan");

    // 2. Get all users who have the CAANG role
    const { data: userRoles, error: urErr } = await supabase
      .from("user_roles")
      .select(
        "user_id, users!user_roles_user_id_fkey(email, profiles(full_name))",
      )
      .eq("role_id", roleData.id);

    if (urErr) throw urErr;

    // 3. (Optional) Filter blacklist
    // Jika ada blacklist bisa diambil di sini
    // const { data: blacklists } = await supabase.from('user_blacklists').select('user_id');
    // const blacklistIds = new Set(blacklists?.map(b => b.user_id) || []);

    // 4. Fetch all internship applications
    const { data: apps, error: appErr } = await supabase
      .from("or_internship_applications")
      .select("user_id, status, is_manual_registration, created_at");

    if (appErr) throw appErr;

    const appsMap = new Map(apps.map((app) => [app.user_id, app]));

    // 5. Combine data
    const result: CaangMagangRow[] = [];

    interface UserRoleDetail {
      email: string | null;
      profiles:
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null;
    }

    for (const ur of userRoles || []) {
      const uId = ur.user_id;
      // if (blacklistIds.has(uId)) continue; // Lewati yang di blacklist

      const userDetail = ur.users as unknown as UserRoleDetail;
      const appData = appsMap.get(uId);

      const profiles = userDetail?.profiles;
      const parsedFullName = Array.isArray(profiles)
        ? profiles[0]?.full_name
        : profiles?.full_name;

      result.push({
        user_id: uId,
        full_name: parsedFullName || "Tanpa Nama",
        email: userDetail?.email || "-",
        has_registered: !!appData,
        is_manual: appData ? appData.is_manual_registration : false,
        status: appData
          ? (appData.status as CaangMagangRow["status"])
          : "unregistered",
        submitted_at: appData ? appData.created_at : null,
      });
    }

    // Sort by name A-Z
    result.sort((a, b) => a.full_name.localeCompare(b.full_name));

    return ok(result);
  } catch (err: unknown) {
    console.error("[getMagangDatabaseData]", err);
    return fail(
      err instanceof Error
        ? err.message
        : "Gagal mengambil data database magang",
    );
  }
}

// ═══════════════════════════════════════════════════════
// FITUR VERIFIKASI PLOTING
// ═══════════════════════════════════════════════════════

export interface VerifikasiRow {
  id: string;
  user_id: string;
  full_name: string;

  divisi_1_id: string;
  divisi_2_id: string;
  dept_1_id: string;
  dept_2_id: string | null;

  recommended_divisi_id: string | null;
  recommended_dept_id: string | null;
  final_divisi_id: string | null;
  final_dept_id: string | null;

  status: "pending" | "approved" | "rejected";
}

export interface VerifikasiMagangData {
  rows: VerifikasiRow[];
  divisions: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}

export async function getVerifikasiMagangData(): Promise<
  ActionResult<VerifikasiMagangData>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if ("error" in auth && !("userId" in auth)) return fail(auth.error!);

    const supabase = await createClient();

    // 1. Fetch apps
    const { data: apps, error: appErr } = await supabase
      .from("or_internship_applications")
      .select("*")
      .order("created_at", { ascending: true }); // FCFS order

    if (appErr) throw appErr;

    // 2. Fetch profiles for names
    const userIds = apps.map((a) => a.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.full_name]),
    );

    // 3. Fetch Master Divisions & Departments
    const { data: divisions } = await supabase
      .from("divisions")
      .select("id, name");
    const { data: departments } = await supabase
      .from("departments")
      .select("id, name");

    // 4. Transform
    const rows: VerifikasiRow[] = apps.map((app) => ({
      id: app.id,
      user_id: app.user_id,
      full_name: profileMap.get(app.user_id) || "Tanpa Nama",

      divisi_1_id: app.divisi_1_id,
      divisi_2_id: app.divisi_2_id,
      dept_1_id: app.dept_1_id,
      dept_2_id: app.dept_2_id,

      recommended_divisi_id: app.recommended_divisi_id,
      recommended_dept_id: app.recommended_dept_id,
      final_divisi_id: app.final_divisi_id,
      final_dept_id: app.final_dept_id,

      status: app.status as VerifikasiRow["status"],
    }));

    return ok({
      rows,
      divisions: divisions || [],
      departments: departments || [],
    });
  } catch (err: unknown) {
    console.error("[getVerifikasiMagangData]", err);
    return fail(
      err instanceof Error
        ? err.message
        : "Gagal mengambil data verifikasi magang",
    );
  }
}

export async function updateFinalPlacement(
  appId: string,
  type: "divisi" | "departemen",
  targetId: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if ("error" in auth && !("userId" in auth)) return fail(auth.error!);

    const supabase = await createClient();

    const payload =
      type === "divisi"
        ? { final_divisi_id: targetId }
        : { final_dept_id: targetId };

    const { error } = await supabase
      .from("or_internship_applications")
      .update(payload)
      .eq("id", appId);

    if (error) throw error;

    return ok({ success: true });
  } catch (err: unknown) {
    console.error("[updateFinalPlacement]", err);
    return fail(
      err instanceof Error ? err.message : "Gagal menyimpan penempatan magang",
    );
  }
}

export async function approveDraftPlacements(
  type: "divisi" | "departemen",
  appIds?: string[], // jika tidak ada, approve semua pending yang belum punya final
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if ("error" in auth && !("userId" in auth)) return fail(auth.error!);

    const supabase = await createClient();

    let query = supabase.from("or_internship_applications").select("*");
    if (appIds && appIds.length > 0) {
      query = query.in("id", appIds);
    } else {
      query = query.eq("status", "pending");
    }

    const { data: targets, error: targetErr } = await query;
    if (targetErr) throw targetErr;

    const toUpdate = targets.filter((t) => {
      if (type === "divisi")
        return !t.final_divisi_id && t.recommended_divisi_id;
      return !t.final_dept_id && t.recommended_dept_id;
    });

    if (toUpdate.length === 0) return ok({ success: true });

    // Batch update since SDK doesn't support easy bulk conditional update natively yet
    await Promise.all(
      toUpdate.map((t) => {
        const payload =
          type === "divisi"
            ? { final_divisi_id: t.recommended_divisi_id }
            : { final_dept_id: t.recommended_dept_id };
        return supabase
          .from("or_internship_applications")
          .update(payload)
          .eq("id", t.id);
      }),
    );

    return ok({ success: true });
  } catch (err: unknown) {
    console.error("[approveDraftPlacements]", err);
    return fail(
      err instanceof Error
        ? err.message
        : "Gagal menyetujui rekomendasi magang",
    );
  }
}

// ═══════════════════════════════════════════════════════
// DETAIL FORM (Dialog Pop-Up)
// ═══════════════════════════════════════════════════════

export async function getMagangApplicationDetail(
  userId: string,
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const auth = await requireModule("open-recruitment");
    if ("error" in auth && !("userId" in auth)) return fail(auth.error!);

    const supabase = await createClient();

    const { data: app, error } = await supabase
      .from("or_internship_applications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!app) return fail("Data formulir tidak ditemukan");

    // Fetch Divisions & Depts references manually
    const { data: divisions } = await supabase
      .from("divisions")
      .select("id, name");
    const { data: departments } = await supabase
      .from("departments")
      .select("id, name");

    const divMap = new Map((divisions || []).map((d) => [d.id, d.name]));
    const deptMap = new Map((departments || []).map((d) => [d.id, d.name]));

    return ok({
      ...app,
      divisi_1: { name: divMap.get(app.divisi_1_id) || "-" },
      divisi_2: { name: divMap.get(app.divisi_2_id) || "-" },
      dept_1: { name: deptMap.get(app.dept_1_id) || "-" },
      dept_2: { name: app.dept_2_id ? deptMap.get(app.dept_2_id) : undefined },
      recommended_divisi_name: app.recommended_divisi_id
        ? divMap.get(app.recommended_divisi_id)
        : null,
      recommended_dept_name: app.recommended_dept_id
        ? deptMap.get(app.recommended_dept_id)
        : null,
      final_divisi_name: app.final_divisi_id
        ? divMap.get(app.final_divisi_id)
        : null,
      final_dept_name: app.final_dept_id
        ? deptMap.get(app.final_dept_id)
        : null,
    });
  } catch (err: unknown) {
    console.error("[getMagangApplicationDetail]", err);
    return fail(
      err instanceof Error ? err.message : "Gagal mengambil detail formulir",
    );
  }
}

// ═══════════════════════════════════════════════════════
// DAFTAR MANUAL BY ADMIN
// ═══════════════════════════════════════════════════════

export async function getDivisionsAndDepts(): Promise<
  ActionResult<{
    divisions: { id: string; name: string }[];
    departments: { id: string; name: string }[];
  }>
> {
  try {
    const supabase = await createClient();
    const { data: divisions } = await supabase
      .from("divisions")
      .select("id, name");
    const { data: departments } = await supabase
      .from("departments")
      .select("id, name");

    return ok({
      divisions: divisions || [],
      departments: departments || [],
    });
  } catch (err: unknown) {
    return fail(
      err instanceof Error
        ? err.message
        : "Gagal mengambil data divisi/departemen",
    );
  }
}

export interface ManualApplicationPayload {
  user_id: string;
  minat: string;
  alasan_minat: string;
  skill: string;

  divisi_1: string;
  yakin_divisi_1: string;
  alasan_divisi_1: string;
  divisi_2?: string | null;
  yakin_divisi_2?: string | null;
  alasan_divisi_2?: string | null;

  dept_1: string;
  yakin_dept_1: string;
  alasan_dept_1: string;
  dept_2?: string | null;
  yakin_dept_2?: string | null;
  alasan_dept_2?: string | null;
}

export async function createManualInternshipApplication(
  payload: ManualApplicationPayload,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if ("error" in auth && !("userId" in auth)) return fail(auth.error!);

    const supabase = await createClient();

    // Pastikan user belum mendaftar
    const { data: existing } = await supabase
      .from("or_internship_applications")
      .select("id")
      .eq("user_id", payload.user_id)
      .maybeSingle();

    if (existing) return fail("User tersebut sudah mendaftar magang.");

    // Resolve Strings to UUIDs
    const [{ data: divisionsList }, { data: deptsList }] = await Promise.all([
      supabase.from("divisions").select("id, slug"),
      supabase.from("departments").select("id, slug"),
    ]);

    if (!divisionsList || !deptsList) {
      return fail("Gagal memuat referensi slug divisi/departemen.");
    }

    const DIVISION_SLUG_MAP: Record<string, string> = {
      KRAI: "krai",
      "KRSBI-B": "krsbi-beroda",
      "KRSBI-H": "krsbi-humanoid",
      KRTI: "krsti",
      KRSTI: "krsti",
      KRSRI: "krsri",
    };

    const DEPT_SLUG_MAP: Record<string, string> = {
      Kestari: "kesekretariatan",
      Maintanance: "mekanikal-maintenance",
      Maintenance: "mekanikal-maintenance",
      Produksi: "mekanikal-produksi",
      Humas: "infokom-humas",
      Pubdok: "infokom-pubdok",
      Kpsdm: "litbang-psdm",
      Ristek: "litbang-ristek",
    };

    const div1Id = divisionsList.find(
      (d: { id: string; slug: string }) =>
        d.slug === DIVISION_SLUG_MAP[payload.divisi_1],
    )?.id;
    const div2Id = payload.divisi_2
      ? divisionsList.find(
          (d: { id: string; slug: string }) =>
            d.slug === DIVISION_SLUG_MAP[payload.divisi_2!],
        )?.id
      : null;
    const dept1Id = deptsList.find(
      (d: { id: string; slug: string }) =>
        d.slug === DEPT_SLUG_MAP[payload.dept_1],
    )?.id;
    const dept2Id = payload.dept_2
      ? deptsList.find(
          (d: { id: string; slug: string }) =>
            d.slug === DEPT_SLUG_MAP[payload.dept_2!],
        )?.id
      : null;

    if (!div1Id || !dept1Id) {
      return fail(
        "Divisi atau departemen utama tidak kompatibel dengan slug database.",
      );
    }

    // Sisipkan secara manual dengan flagging admin override
    const { error: insertErr } = await supabase
      .from("or_internship_applications")
      .insert({
        user_id: payload.user_id,
        minat: payload.minat,
        alasan_minat: payload.alasan_minat,
        skill: payload.skill,

        divisi_1_id: div1Id,
        yakin_divisi_1: payload.yakin_divisi_1,
        alasan_divisi_1: payload.alasan_divisi_1,
        divisi_2_id: div2Id,
        yakin_divisi_2: payload.yakin_divisi_2 || null,
        alasan_divisi_2: payload.alasan_divisi_2 || null,

        dept_1_id: dept1Id,
        yakin_dept_1: payload.yakin_dept_1,
        alasan_dept_1: payload.alasan_dept_1,
        dept_2_id: dept2Id,
        yakin_dept_2: payload.yakin_dept_2 || null,
        alasan_dept_2: payload.alasan_dept_2 || null,

        // Rekomendasikan langsung ke pilihan utama karena Manual Admin
        recommended_divisi_id: div1Id,
        recommended_dept_id: dept1Id,

        is_manual_registration: true,
        status: "pending",
      } as never);

    if (insertErr) throw insertErr;

    return ok({ success: true });
  } catch (err: unknown) {
    console.error("[createManualInternshipApplication]", err);
    return fail(
      err instanceof Error
        ? err.message
        : "Gagal menyimpan pendaftaran manual.",
    );
  }
}
