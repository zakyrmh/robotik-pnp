"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  UpdateUserIdentitySchema,
  SoftDeleteUserSchema,
  RestoreUserSchema,
  UserFilterSchema,
  type UpdateUserIdentityInput,
  type SoftDeleteUserInput,
  type RestoreUserInput,
} from "@/lib/schemas/user-management";
import {
  UserManagementFilter,
  UserManagementItem,
  UserManagementQueryResult,
  SystemAuditLogQueryResult,
} from "@/lib/types/user-management";

// ============================================================================
// HELPER FUNCTION: VERIFY SUPER ADMIN ROLE
// ============================================================================

async function verifySuperAdminRole() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !currentUser) {
    throw new Error("Unauthorized: Sesi autentikasi tidak ditemukan.");
  }

  const { data: callerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", currentUser.id)
    .single();

  if (profileError || !callerProfile || callerProfile.role !== "super-admin") {
    throw new Error(
      "Forbidden: Peran Super Admin diperlukan untuk tindakan ini.",
    );
  }

  return { supabase, currentUser, callerProfile };
}

// ============================================================================
// HELPER FUNCTION: AUDIT LOG WRITER
// ============================================================================

async function logSystemAuditEntry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  actorId: string,
  actionType: string,
  targetUserId?: string | null,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
  details?: string | null,
) {
  try {
    await supabase.from("system_audit_logs").insert({
      actor_id: actorId,
      action_type: actionType,
      target_user_id: targetUserId || null,
      old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      details: details || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Gagal mencatat system audit log:", err);
  }
}

// ============================================================================
// SERVER ACTIONS: USER IDENTITY & ROLE MUTATIONS
// ============================================================================

/**
 * 1. Memperbarui Identitas dan Peran (Role) Pengguna
 */
export async function updateUserIdentityAction(
  rawInput: UpdateUserIdentityInput,
) {
  const { supabase, currentUser } = await verifySuperAdminRole();
  const validated = UpdateUserIdentitySchema.parse(rawInput);

  // Guard A: Self-Demotion Guard
  if (currentUser.id === validated.userId && validated.role !== "super-admin") {
    throw new Error(
      "Anda tidak dapat mencopot role Super Admin dari akun Anda sendiri.",
    );
  }

  // Guard B: Last Super Admin Guard
  if (validated.role !== "super-admin") {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role, full_name, nim, is_onboarded")
      .eq("id", validated.userId)
      .single();

    if (targetProfile?.role === "super-admin") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super-admin")
        .is("deleted_at", null);

      if ((count || 0) <= 1) {
        throw new Error(
          "Gagal: Tidak dapat mengubah peran Super Admin terakhir di dalam sistem.",
        );
      }
    }
  }

  // Ambil data profil & pendaftaran lama untuk catatan audit log
  const { data: oldProfile } = await supabase
    .from("profiles")
    .select("role, full_name, nim, is_onboarded")
    .eq("id", validated.userId)
    .single();

  const { data: oldReg } = await supabase
    .from("registrations")
    .select("phone_number, study_program_id")
    .eq("profile_id", validated.userId)
    .maybeSingle();

  // Mutasi 1: Update tabel profiles
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: validated.fullName,
      nim: validated.nim || null,
      role: validated.role,
      is_onboarded: validated.isOnboarded,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validated.userId);

  if (profileErr) {
    throw new Error(`Gagal memperbarui profil pengguna: ${profileErr.message}`);
  }

  // Mutasi 2: Update tabel registrations jika record pendaftaran ada
  if (oldReg) {
    const { error: regErr } = await supabase
      .from("registrations")
      .update({
        full_name: validated.fullName,
        phone_number: validated.phoneNumber || "",
        study_program_id: validated.studyProgramId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", validated.userId);

    if (regErr) {
      console.warn("Gagal memperbarui tabel registrations:", regErr.message);
    }
  }

  // Record Audit Log
  await logSystemAuditEntry(
    supabase,
    currentUser.id,
    "UPDATE_USER_IDENTITY",
    validated.userId,
    {
      role: oldProfile?.role,
      fullName: oldProfile?.full_name,
      nim: oldProfile?.nim,
      isOnboarded: oldProfile?.is_onboarded,
      phoneNumber: oldReg?.phone_number,
      studyProgramId: oldReg?.study_program_id,
    },
    {
      role: validated.role,
      fullName: validated.fullName,
      nim: validated.nim,
      isOnboarded: validated.isOnboarded,
      phoneNumber: validated.phoneNumber,
      studyProgramId: validated.studyProgramId,
    },
    `Pembaruan identitas & peran pengguna ${validated.fullName} (${validated.role})`,
  );

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: "Berhasil memperbarui data dan peran pengguna.",
  };
}

/**
 * 2. Soft-Delete (Pengarsipan / Nonaktifkan) Akun Pengguna
 */
export async function softDeleteUserAction(rawInput: SoftDeleteUserInput) {
  const { supabase, currentUser } = await verifySuperAdminRole();
  const validated = SoftDeleteUserSchema.parse(rawInput);

  // Guard A: Self-Delete Guard
  if (currentUser.id === validated.userId) {
    throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
  }

  // Guard B: Last Super Admin Guard
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role, full_name, deleted_at")
    .eq("id", validated.userId)
    .single();

  if (targetProfile?.role === "super-admin") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super-admin")
      .is("deleted_at", null);

    if ((count || 0) <= 1) {
      throw new Error(
        "Gagal: Tidak dapat menonaktifkan Super Admin terakhir di dalam sistem.",
      );
    }
  }

  const nowStr = new Date().toISOString();

  // Mutasi 1: Update Soft Delete pada profiles
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      deleted_at: nowStr,
      delete_reason: validated.deleteReason,
      updated_at: nowStr,
    })
    .eq("id", validated.userId);

  if (profileErr) {
    throw new Error(`Gagal menonaktifkan akun profil: ${profileErr.message}`);
  }

  // Mutasi 2: Update Soft Delete pada registrations
  const { error: regErr } = await supabase
    .from("registrations")
    .update({
      deleted_at: nowStr,
      delete_reason: validated.deleteReason,
      updated_at: nowStr,
    })
    .eq("profile_id", validated.userId);

  if (regErr) {
    console.warn(
      "Gagal memperbarui soft delete registrations:",
      regErr.message,
    );
  }

  // Record Audit Log
  await logSystemAuditEntry(
    supabase,
    currentUser.id,
    "SOFT_DELETE_USER",
    validated.userId,
    { deleted_at: targetProfile?.deleted_at || null },
    { deleted_at: nowStr, delete_reason: validated.deleteReason },
    `Nonaktifkan akun ${targetProfile?.full_name || validated.userId}. Alasan: ${validated.deleteReason}`,
  );

  revalidatePath("/admin/users");
  return { success: true, message: "Berhasil menonaktifkan akun pengguna." };
}

/**
 * 3. Memulihkan (Restore) Akun Pengguna yang Diarsip
 */
export async function restoreUserAction(rawInput: RestoreUserInput) {
  const { supabase, currentUser } = await verifySuperAdminRole();
  const validated = RestoreUserSchema.parse(rawInput);

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("full_name, deleted_at, delete_reason")
    .eq("id", validated.userId)
    .single();

  const nowStr = new Date().toISOString();

  // Mutasi 1: Restore profiles
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      deleted_at: null,
      delete_reason: null,
      updated_at: nowStr,
    })
    .eq("id", validated.userId);

  if (profileErr) {
    throw new Error(`Gagal memulihkan profil pengguna: ${profileErr.message}`);
  }

  // Mutasi 2: Restore registrations
  await supabase
    .from("registrations")
    .update({
      deleted_at: null,
      delete_reason: null,
      updated_at: nowStr,
    })
    .eq("profile_id", validated.userId);

  // Record Audit Log
  await logSystemAuditEntry(
    supabase,
    currentUser.id,
    "RESTORE_USER",
    validated.userId,
    {
      deleted_at: targetProfile?.deleted_at,
      delete_reason: targetProfile?.delete_reason,
    },
    { deleted_at: null, delete_reason: null },
    `Memulihkan akun pengguna ${targetProfile?.full_name || validated.userId}`,
  );

  revalidatePath("/admin/users");
  return { success: true, message: "Berhasil memulihkan akun pengguna." };
}

/**
 * 4. Reset Status Onboarding Pengguna
 */
export async function resetUserOnboardingAction(userId: string) {
  const { supabase, currentUser } = await verifySuperAdminRole();

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("full_name, is_onboarded")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_onboarded: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Gagal mereset status onboarding: ${error.message}`);
  }

  // Record Audit Log
  await logSystemAuditEntry(
    supabase,
    currentUser.id,
    "RESET_USER_ONBOARDING",
    userId,
    { is_onboarded: targetProfile?.is_onboarded },
    { is_onboarded: false },
    `Reset status onboarding pengguna ${targetProfile?.full_name || userId}`,
  );

  revalidatePath("/admin/users");
  return {
    success: true,
    message: "Berhasil mereset status onboarding pengguna.",
  };
}

// ============================================================================
// SERVER ACTIONS: READ QUERIES (DATA FETCHING FOR SERVER COMPONENTS)
// ============================================================================

/**
 * 5. Mengambil Daftar Pengguna Terpaginasi dengan Filter & Pencarian
 */
export async function getUsersAction(
  filter: UserManagementFilter = {},
): Promise<UserManagementQueryResult> {
  const { supabase } = await verifySuperAdminRole();

  const validated = UserFilterSchema.parse({
    search: filter.search || undefined,
    role: filter.role || undefined,
    studyProgramId: filter.studyProgramId || undefined,
    status: filter.status || "all",
    page: filter.page || 1,
    perPage: filter.perPage || 10,
  });

  const page = validated.page;
  const perPage = validated.perPage;
  const from = (page - 1) * perPage;
  const to = page * perPage - 1;

  let query = supabase.from("profiles").select(
    `
      id,
      email,
      full_name,
      nim,
      role,
      is_onboarded,
      avatar_url,
      deleted_at,
      delete_reason,
      created_at,
      registrations (
        phone_number,
        study_program_id,
        status,
        deleted_at,
        delete_reason,
        study_programs (
          name
        )
      )
    `,
    { count: "exact" },
  );

  // Filter A: Role
  if (validated.role && validated.role !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("role", validated.role as any);
  }

  // Filter B: Status Akun (active, archived, all)
  if (validated.status === "active") {
    query = query.is("deleted_at", null);
  } else if (validated.status === "archived") {
    query = query.not("deleted_at", "is", null);
  }

  // Filter C: Pencarian Teks (full_name, nim, email)
  if (validated.search && validated.search.trim()) {
    const search = validated.search.trim();
    query = query.or(
      `full_name.ilike.%${search}%,nim.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  // Paginasi & Urutan (Terbaru)
  const primaryResult = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawData: any[] | null = primaryResult.data;
  let count = primaryResult.count;
  let error = primaryResult.error;

  // Fallback jika migrasi deleted_at di DB cloud belum/sedang dieksekusi
  if (error && error.message.includes("deleted_at")) {
    let fallbackQuery = supabase.from("profiles").select(
      `
      id,
      email,
      full_name,
      nim,
      role,
      is_onboarded,
      avatar_url,
      created_at,
      registrations (
        phone_number,
        study_program_id,
        status,
        study_programs (
          name
        )
      )
    `,
      { count: "exact" },
    );

    if (validated.role && validated.role !== "all") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fallbackQuery = fallbackQuery.eq("role", validated.role as any);
    }
    if (validated.search && validated.search.trim()) {
      const search = validated.search.trim();
      fallbackQuery = fallbackQuery.or(
        `full_name.ilike.%${search}%,nim.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const fallbackResult = await fallbackQuery
      .order("created_at", { ascending: false })
      .range(from, to);

    rawData = fallbackResult.data;
    count = fallbackResult.count;
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(`Gagal mengambil data pengguna: ${error.message}`);
  }

  // Map ke bentuk UserManagementItem yang bersih
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: UserManagementItem[] = (rawData || []).map((row: any) => {
    const reg = Array.isArray(row.registrations)
      ? row.registrations[0]
      : row.registrations;
    const prog =
      reg && reg.study_programs
        ? Array.isArray(reg.study_programs)
          ? reg.study_programs[0]
          : reg.study_programs
        : null;

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      nim: row.nim,
      role: row.role,
      isOnboarded: row.is_onboarded,
      avatarUrl: row.avatar_url,
      phoneNumber: reg?.phone_number || null,
      studyProgramId: reg?.study_program_id || null,
      studyProgramName: prog?.name || null,
      registrationStatus: reg?.status || null,
      deletedAt: row.deleted_at || reg?.deleted_at || null,
      deleteReason: row.delete_reason || reg?.delete_reason || null,
      createdAt: row.created_at,
    };
  });

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / perPage);

  return {
    data: items,
    totalCount,
    page,
    perPage,
    totalPages,
  };
}

/**
 * 6. Mengambil Daftar Program Studi untuk Opsi Dropdown
 */
export async function getStudyProgramsOptionsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_programs")
    .select("id, name, degree")
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data program studi:", error.message);
    return [];
  }

  return data || [];
}

/**
 * 7. Mengambil Log Audit Sistem Terpaginasi (Super Admin Only)
 */
export async function getAuditLogsAction(
  page = 1,
  perPage = 10,
): Promise<SystemAuditLogQueryResult> {
  const { supabase } = await verifySuperAdminRole();

  const from = (page - 1) * perPage;
  const to = page * perPage - 1;

  const {
    data: rawData,
    count,
    error,
  } = await supabase
    .from("system_audit_logs")
    .select(
      `
      id,
      actor_id,
      action_type,
      target_user_id,
      old_value,
      new_value,
      details,
      ip_address,
      created_at
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Gagal membaca audit logs:", error.message);
    return {
      data: [],
      totalCount: 0,
      page,
      perPage,
      totalPages: 0,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (rawData || []).map((row: any) => ({
    id: row.id,
    actorId: row.actor_id,
    actionType: row.action_type,
    targetUserId: row.target_user_id,
    oldValue: row.old_value,
    newValue: row.new_value,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  }));

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / perPage);

  return {
    data: items,
    totalCount,
    page,
    perPage,
    totalPages,
  };
}
