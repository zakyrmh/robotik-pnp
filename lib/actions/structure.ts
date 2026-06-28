"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Database } from "@/types/database.types";

// Auth checker function
async function verifyAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false, error: "Sesi tidak ditemukan. Silakan login kembali." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super-admin" && profile.role !== "admin-or")) {
    return { authorized: false, error: "Akses ditolak. Anda tidak memiliki izin." };
  }

  return { authorized: true, user, role: profile.role };
}

// ==========================================
// MEMBERSHIP PERIODS
// ==========================================

const membershipPeriodSchema = z.object({
  period_name: z.string().min(1, "Nama periode harus diisi"),
  is_active: z.boolean(),
});

export async function createMembershipPeriod(data: z.infer<typeof membershipPeriodSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = membershipPeriodSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("membership_periods").insert(parsed.data);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function updateMembershipPeriod(id: string, data: z.infer<typeof membershipPeriodSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = membershipPeriodSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("membership_periods")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function deleteMembershipPeriod(id: string) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("membership_periods").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}


// ==========================================
// DEPARTMENTS
// ==========================================

const departmentSchema = z.object({
  name: z.string().min(1, "Nama departemen harus diisi"),
  category: z.string().default("General"),
  sort_order: z.number().nullable().optional(),
});

export async function createDepartment(data: z.infer<typeof departmentSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = departmentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("departments").insert(parsed.data);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function updateDepartment(id: string, data: z.infer<typeof departmentSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = departmentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("departments")
      .update(parsed.data)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function deleteDepartment(id: string) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}


// ==========================================
// LEGACY MEMBERS
// ==========================================

const legacyMemberSchema = z.object({
  nim: z.string().min(1, "NIM harus diisi"),
  full_name: z.string().min(1, "Nama lengkap harus diisi"),
  gender: z.string().nullable().optional(),
});

export async function createLegacyMember(data: z.infer<typeof legacyMemberSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = legacyMemberSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("legacy_members").insert(parsed.data);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function updateLegacyMember(nim: string, data: z.infer<typeof legacyMemberSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = legacyMemberSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("legacy_members")
      .update(parsed.data)
      .eq("nim", nim);

    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function deleteLegacyMember(nim: string) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("legacy_members").delete().eq("nim", nim);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}


// ==========================================
// DIVISIONS
// ==========================================

const divisionSchema = z.object({
  name: z.string().min(1, "Nama divisi harus diisi"),
  slug: z.string().min(1, "Slug harus diisi"),
  short_description: z.string().default(""),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().nullable().optional(),
  badge_label: z.string().nullable().optional(),
  badge_color: z.string().nullable().optional(),
  accent_color: z.string().nullable().optional(),
});

export async function createDivision(data: z.infer<typeof divisionSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = divisionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("divisions").insert({
      ...parsed.data,
      tags: []
    });
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function updateDivision(id: string, data: z.infer<typeof divisionSchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = divisionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("divisions")
      .update(parsed.data)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function deleteDivision(id: string) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("divisions").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}


// ==========================================
// ORGANIZATIONAL HISTORIES
// ==========================================

const orgHistorySchema = z.object({
  period_id: z.string().min(1, "Periode harus diisi"),
  nim_member: z.string().min(1, "Anggota harus diisi"),
  department_id: z.string().min(1, "Departemen harus diisi"),
  division_id: z.string().nullable().optional(),
  role_name: z.string().default("Anggota"),
  sub_section: z.string().nullable().optional(),
  sort_order: z.number().nullable().optional(),
});

export async function createOrgHistory(data: z.infer<typeof orgHistorySchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = orgHistorySchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("organizational_histories").insert(parsed.data);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function updateOrgHistory(id: string, data: z.infer<typeof orgHistorySchema>) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const parsed = orgHistorySchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("organizational_histories")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}

export async function deleteOrgHistory(id: string) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = await createClient();
  try {
    const { error } = await supabase.from("organizational_histories").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/manajemen-struktur");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" };
  }
}
