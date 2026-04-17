"use server";

/**
 * Server Actions — Modul Open Recruitment (Admin OR)
 *
 * Guard akses:
 * - requireModule('open-recruitment') → OR admin, admin, super_admin
 * - requireAuth()                     → caang (self-service)
 */

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuth,
  requireModule,
  isActionError,
  ok,
  fail,
} from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";
import type {
  OrRegistrationWithUser,
  OrRegistrationStatus,
  OrBlacklistWithUser,
} from "@/lib/db/schema/or";

// ═══════════════════════════════════════════════════════
// VALIDASI SCHEMA
// ═══════════════════════════════════════════════════════

const verifyRegistrationSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["accepted", "rejected", "revision"]),
  notes: z.string().max(1000).optional(),
  revisionFields: z.array(z.string()).optional(),
});

const updatePipelineSchema = z.object({
  userId: z.string().uuid(),
  pipelineStatus: z.enum([
    "intro_demo",
    "interview_1_passed",
    "interview_1_failed",
    "training",
    "family_gathering",
    "project",
    "interview_2_passed",
    "interview_2_failed",
    "internship_rolling",
    "internship_fixed",
    "inducted",
    "blacklisted",
  ]),
  notes: z.string().max(500).optional(),
});

const blacklistSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10, "Alasan minimal 10 karakter").max(500),
});

const groupSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["project", "internship_rolling"]),
  description: z.string().max(500).optional(),
});

const assignGroupMemberSchema = z.object({
  groupId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1),
});

const rollingInternshipSchema = z.object({
  groupId: z.string().uuid(),
  divisionId: z.string().uuid(),
  sessionDate: z.string().date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  location: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
});

const fixedQuotaSchema = z.object({
  divisionId: z.string().uuid(),
  quota: z.number().int().min(0),
});

const assignFixedInternshipSchema = z.object({
  userId: z.string().uuid(),
  divisionId: z.string().uuid(),
  assignmentNotes: z.string().max(500).optional(),
});

// ═══════════════════════════════════════════════════════
// PENDAFTARAN — READ
// ═══════════════════════════════════════════════════════

/** Ambil semua pendaftaran — khusus OR admin */
export async function getRegistrations(filters?: {
  status?: OrRegistrationStatus;
  pipelineStatus?:
    | "intro_demo"
    | "interview_1_passed"
    | "interview_1_failed"
    | "training"
    | "family_gathering"
    | "project"
    | "interview_2_passed"
    | "interview_2_failed"
    | "internship_rolling"
    | "internship_fixed"
    | "inducted"
    | "blacklisted";
  search?: string;
}): Promise<ActionResult<OrRegistrationWithUser[]>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    let query = supabase
      .from("or_registrations")
      .select(
        `
        *,
        users!or_registrations_user_id_fkey (
          email,
          profiles (
            full_name, nickname, avatar_url, gender,
            birth_place, birth_date, phone, address_domicile
          ),
          user_roles!user_roles_user_id_fkey (
            roles ( name )
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.pipelineStatus) {
      query = query.eq(
        "pipeline_status",
        filters.pipelineStatus as NonNullable<typeof filters.pipelineStatus>,
      );
    }

    const { data, error } = await query;
    if (error) return fail(error.message);

    // Filter hanya caang (exclude staff/anggota)
    const caangOnly = (data ?? []).filter((d) => {
      const usr = Array.isArray(d.users) ? d.users[0] : d.users;
      const userRoles = usr?.user_roles ?? [];
      const rolesArr = Array.isArray(userRoles) ? userRoles : [userRoles];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !rolesArr.some((ur: any) =>
        ["super_admin", "admin", "anggota"].includes(ur.roles?.name),
      );
    });

    // Ambil education_details untuk user yang lolos filter
    const userIds = caangOnly.map((d) => d.user_id);
    const { data: eduData } =
      userIds.length > 0
        ? await supabase
            .from("education_details")
            .select(
              "user_id, nim, study_program_id, study_programs(name, majors(name))",
            )
            .in("user_id", userIds)
        : { data: [] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eduMap = new Map<string, any>();
    for (const e of eduData ?? []) eduMap.set(e.user_id, e);

    const mapped = caangOnly.map((d) => {
      const usr = Array.isArray(d.users) ? d.users[0] : d.users;
      const profileData = usr?.profiles;
      const profile = Array.isArray(profileData) ? profileData[0] : profileData;
      const edu = eduMap.get(d.user_id);
      const sp = Array.isArray(edu?.study_programs)
        ? edu.study_programs[0]
        : edu?.study_programs;
      const mj = Array.isArray(sp?.majors) ? sp.majors[0] : sp?.majors;

      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? "",
        gender: profile?.gender ?? null,
        birth_place: profile?.birth_place ?? null,
        birth_date: profile?.birth_date ?? null,
        phone: profile?.phone ?? null,
        address_domicile: profile?.address_domicile ?? null,
        nim: edu?.nim ?? null,
        study_program_name: sp?.name ?? null,
        major_name: mj?.name ?? null,
        profiles: undefined,
        users: undefined,
      } as OrRegistrationWithUser;
    });

    // Client-side search
    const result = filters?.search
      ? mapped.filter((r) => {
          const q = filters.search!.toLowerCase();
          return (
            r.full_name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            (r.nim?.toLowerCase().includes(q) ?? false) ||
            (r.nickname?.toLowerCase().includes(q) ?? false)
          );
        })
      : mapped;

    return ok(result);
  } catch (err) {
    console.error("[getRegistrations]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil satu pendaftaran by ID — query langsung, tidak lewat getRegistrations */
export async function getRegistrationById(
  id: string,
): Promise<ActionResult<OrRegistrationWithUser>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID pendaftaran tidak valid.");

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("or_registrations")
      .select(
        `
        *,
        users!or_registrations_user_id_fkey (
          email,
          profiles (
            full_name, nickname, avatar_url, gender,
            birth_place, birth_date, phone, address_domicile
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) return fail(error.message);

    const usr = Array.isArray(data.users) ? data.users[0] : data.users;
    const profile = Array.isArray(usr?.profiles)
      ? usr.profiles[0]
      : usr?.profiles;

    const { data: edu } = await supabase
      .from("education_details")
      .select("nim, study_program_id, study_programs(name, majors(name))")
      .eq("user_id", data.user_id)
      .maybeSingle();

    const sp = Array.isArray(edu?.study_programs)
      ? edu.study_programs[0]
      : edu?.study_programs;
    const mj = Array.isArray(sp?.majors) ? sp.majors[0] : sp?.majors;

    return ok({
      ...data,
      full_name: profile?.full_name ?? "",
      nickname: profile?.nickname ?? null,
      avatar_url: profile?.avatar_url ?? null,
      email: usr?.email ?? "",
      gender: profile?.gender ?? null,
      birth_place: profile?.birth_place ?? null,
      birth_date: profile?.birth_date ?? null,
      phone: profile?.phone ?? null,
      address_domicile: profile?.address_domicile ?? null,
      nim: edu?.nim ?? null,
      study_program_name: sp?.name ?? null,
      major_name: mj?.name ?? null,
      profiles: undefined,
      users: undefined,
    } as OrRegistrationWithUser);
  } catch (err) {
    console.error("[getRegistrationById]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// VERIFIKASI BERKAS
// ═══════════════════════════════════════════════════════

/** Verifikasi pendaftar: terima, tolak, atau minta revisi — khusus OR admin */
export async function verifyRegistration(
  input: z.infer<typeof verifyRegistrationSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = verifyRegistrationSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    const updates: Record<string, unknown> = {
      status: parsed.data.decision,
      verified_by: auth.userId,
      verified_at: new Date().toISOString(),
      verification_notes: parsed.data.notes ?? null,
    };

    if (parsed.data.decision === "revision") {
      updates.revision_fields = parsed.data.revisionFields ?? null;
    }

    // Jika accepted, set pipeline_status awal
    if (parsed.data.decision === "accepted") {
      updates.pipeline_status = "intro_demo";
    }

    // Jika rejected, clear pipeline_status
    if (parsed.data.decision === "rejected") {
      updates.pipeline_status = null;
    }

    const { error } = await supabase
      .from("or_registrations")
      .update(updates)
      .eq("id", parsed.data.id)
      .in("status", ["submitted", "revision"]);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[verifyRegistration]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Update pipeline status caang — khusus OR admin.
 * Saat inducted, trigger database otomatis upgrade role ke anggota.
 */
export async function updatePipelineStatus(
  input: z.infer<typeof updatePipelineSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = updatePipelineSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    const updates: Record<string, unknown> = {
      pipeline_status: parsed.data.pipelineStatus,
    };

    // Catat catatan verifikasi jika ada
    if (parsed.data.notes) {
      updates.verification_notes = parsed.data.notes;
      updates.verified_by = auth.userId;
      updates.verified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("or_registrations")
      .update(updates)
      .eq("user_id", parsed.data.userId)
      .eq("status", "accepted");

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[updatePipelineStatus]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Admin update data pendaftaran — khusus OR admin */
export async function adminUpdateRegistration(
  id: string,
  updates: Partial<{
    motivation: string | null;
    org_experience: string | null;
    achievements: string | null;
    year_enrolled: number | null;
    photo_url: string | null;
    ktm_url: string | null;
    ig_follow_url: string | null;
    ig_mrc_url: string | null;
    yt_sub_url: string | null;
    payment_url: string | null;
    payment_method: string | null;
    payment_amount: number | null;
  }>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID pendaftaran tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("or_registrations")
      .update(updates)
      .eq("id", id);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[adminUpdateRegistration]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Admin update profil user (nama, telepon, alamat, dll) — khusus OR admin */
export async function adminUpdateProfile(
  userId: string,
  updates: Partial<{
    full_name: string;
    nickname: string;
    phone: string;
    address_domicile: string;
  }>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(userId);
    if (!parsed.success) return fail("ID user tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[adminUpdateProfile]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// BLACKLIST
// ═══════════════════════════════════════════════════════

/** Blacklist caang — khusus OR admin */
export async function blacklistCaang(
  input: z.infer<typeof blacklistSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = blacklistSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    // Set pipeline_status blacklisted
    const { error: regErr } = await supabase
      .from("or_registrations")
      .update({ pipeline_status: "blacklisted" })
      .eq("user_id", parsed.data.userId);

    if (regErr) return fail(regErr.message);

    // Insert ke user_blacklist
    const { error: blErr } = await supabase.from("user_blacklist").upsert(
      {
        user_id: parsed.data.userId,
        reason: parsed.data.reason,
        admin_id: auth.userId,
      },
      { onConflict: "user_id" },
    );

    if (blErr) return fail(blErr.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[blacklistCaang]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Tambah user ke blacklist (lengkap) — khusus OR admin */
export async function addToBlacklist(input: {
  userId: string;
  reason: string;
  evidenceUrl?: string;
  isPermanent: boolean;
  expiresAt?: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(input.userId);
    if (!parsed.success) return fail("ID user tidak valid.");
    if (!input.reason || input.reason.length < 10)
      return fail("Alasan minimal 10 karakter.");

    const supabase = await createClient();

    // Set pipeline_status blacklisted
    await supabase
      .from("or_registrations")
      .update({ pipeline_status: "blacklisted" })
      .eq("user_id", input.userId);

    // Insert ke user_blacklist
    const { error } = await supabase.from("user_blacklist").upsert(
      {
        user_id: input.userId,
        reason: input.reason,
        evidence_url: input.evidenceUrl ?? null,
        is_permanent: input.isPermanent,
        expires_at: input.expiresAt ?? null,
        admin_id: auth.userId,
      },
      { onConflict: "user_id" },
    );

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[addToBlacklist]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil daftar blacklist — khusus OR admin */
export async function getBlacklist(): Promise<
  ActionResult<OrBlacklistWithUser[]>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_blacklist")
      .select(
        `
        *,
        profiles!user_blacklist_user_id_fkey(full_name, nickname, avatar_url),
        users!user_blacklist_user_id_fkey(email)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      const usr = Array.isArray(d.users) ? d.users[0] : d.users;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? "",
        profiles: undefined,
        users: undefined,
      } as OrBlacklistWithUser;
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getBlacklist]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Hapus dari blacklist — khusus OR admin */
export async function removeFromBlacklist(
  userId: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(userId);
    if (!parsed.success) return fail("ID user tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("user_blacklist")
      .delete()
      .eq("user_id", userId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[removeFromBlacklist]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// KELOMPOK (PROJECT & MAGANG ROLLING)
// ═══════════════════════════════════════════════════════

/** Ambil semua kelompok — khusus OR admin */
export async function getGroups(
  type?: "project" | "internship_rolling",
): Promise<
  ActionResult<
    { id: string; name: string; type: string; memberCount: number }[]
  >
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    let query = supabase
      .from("or_groups")
      .select("*, or_group_members(count)")
      .order("created_at", { ascending: true });

    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const mapped = (data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      description: g.description,
      memberCount: Array.isArray(g.or_group_members)
        ? g.or_group_members.length
        : 0,
    }));

    return ok(mapped);
  } catch (err) {
    console.error("[getGroups]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Buat kelompok — khusus OR admin */
export async function createGroup(
  input: z.infer<typeof groupSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = groupSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase.from("or_groups").insert({
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      created_by: auth.userId,
    });

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[createGroup]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Assign anggota ke kelompok — khusus OR admin */
export async function assignGroupMembers(
  input: z.infer<typeof assignGroupMemberSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = assignGroupMemberSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    // Hapus member lama lalu insert baru (replace all)
    await supabase
      .from("or_group_members")
      .delete()
      .eq("group_id", parsed.data.groupId);

    const members = parsed.data.userIds.map((uid) => ({
      group_id: parsed.data.groupId,
      user_id: uid,
    }));

    const { error } = await supabase.from("or_group_members").insert(members);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[assignGroupMembers]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// MAGANG ROLLING
// ═══════════════════════════════════════════════════════

/** Buat jadwal sesi magang rolling — khusus OR admin */
export async function createRollingInternshipSession(
  input: z.infer<typeof rollingInternshipSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = rollingInternshipSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase.from("or_rolling_internships").insert({
      group_id: parsed.data.groupId,
      division_id: parsed.data.divisionId,
      session_date: parsed.data.sessionDate,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime ?? null,
      location: parsed.data.location ?? null,
      notes: parsed.data.notes ?? null,
      created_by: auth.userId,
    });

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[createRollingInternshipSession]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil semua sesi magang rolling — khusus OR admin */
export async function getRollingInternshipSessions(
  groupId?: string,
): Promise<ActionResult<unknown[]>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    let query = supabase
      .from("or_rolling_internships")
      .select(
        `
        *,
        or_groups(name),
        divisions(name, slug)
      `,
      )
      .order("session_date", { ascending: true });

    if (groupId) query = query.eq("group_id", groupId);

    const { data, error } = await query;
    if (error) return fail(error.message);
    return ok(data ?? []);
  } catch (err) {
    console.error("[getRollingInternshipSessions]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// MAGANG TETAP
// ═══════════════════════════════════════════════════════

/** Ambil kuota per divisi — OR admin dan caang */
export async function getFixedInternshipQuotas(): Promise<
  ActionResult<unknown[]>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase.from("or_fixed_internship_quotas")
      .select(`
        *,
        divisions(name, slug)
      `);

    if (error) return fail(error.message);
    return ok(data ?? []);
  } catch (err) {
    console.error("[getFixedInternshipQuotas]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Update kuota divisi — khusus OR admin */
export async function updateFixedInternshipQuota(
  input: z.infer<typeof fixedQuotaSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = fixedQuotaSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase
      .from("or_fixed_internship_quotas")
      .update({ quota: parsed.data.quota })
      .eq("division_id", parsed.data.divisionId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[updateFixedInternshipQuota]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Admin assign divisi magang tetap ke caang */
export async function assignFixedInternship(
  input: z.infer<typeof assignFixedInternshipSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = assignFixedInternshipSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase.from("or_fixed_internships").upsert(
      {
        user_id: parsed.data.userId,
        assigned_division_id: parsed.data.divisionId,
        assigned_by: auth.userId,
        assigned_at: new Date().toISOString(),
        assignment_notes: parsed.data.assignmentNotes ?? null,
      },
      { onConflict: "user_id" },
    );

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[assignFixedInternship]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil daftar magang tetap — khusus OR admin */
export async function getFixedInternships(): Promise<ActionResult<unknown[]>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_fixed_internships")
      .select(
        `
        *,
        profiles!or_fixed_internships_user_id_fkey(full_name, nickname, avatar_url),
        chosen:divisions!or_fixed_internships_chosen_division_id_fkey(name, slug),
        assigned:divisions!or_fixed_internships_assigned_division_id_fkey(name, slug)
      `,
      )
      .order("chosen_at", { ascending: true });

    if (error) return fail(error.message);
    return ok(data ?? []);
  } catch (err) {
    console.error("[getFixedInternships]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil opsi prodi untuk dropdown */
export async function getStudyProgramOptions(): Promise<
  ActionResult<{
    majors: { id: string; name: string }[];
    studyPrograms: { id: string; major_id: string; name: string }[];
  }>
> {
  try {
    const supabase = await createClient();
    const [{ data: majors }, { data: prodi }] = await Promise.all([
      supabase.from("majors").select("id, name").order("name"),
      supabase
        .from("study_programs")
        .select("id, major_id, name")
        .order("name"),
    ]);

    return ok({
      majors: majors ?? [],
      studyPrograms: prodi ?? [],
    });
  } catch (err) {
    console.error("[getStudyProgramOptions]", err);
    return fail("Terjadi kesalahan.");
  }
}
