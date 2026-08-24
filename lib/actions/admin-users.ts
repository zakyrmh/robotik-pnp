"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { recordAuditLog } from "@/lib/audit";
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
  SystemAuditLogEntry,
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

  // Get Admin DB client with service role bypass when available to ensure cross-user mutations succeed
  let adminDb = supabase;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      adminDb = createAdminClient();
    } catch {
      adminDb = supabase;
    }
  }

  return { supabase, adminDb, currentUser, callerProfile };
}

// ============================================================================
// SERVER ACTIONS: USER IDENTITY & ROLE MUTATIONS
// ============================================================================

/**
 * 1. Memperbarui Identitas, Program Studi, dan Peran (Role) Pengguna
 */
export async function updateUserIdentityAction(
  rawInput: UpdateUserIdentityInput,
) {
  const { adminDb, currentUser } = await verifySuperAdminRole();
  const validated = UpdateUserIdentitySchema.parse(rawInput);

  // Guard A: Self-Demotion Guard
  if (currentUser.id === validated.userId && validated.role !== "super-admin") {
    throw new Error(
      "Anda tidak dapat mencopot role Super Admin dari akun Anda sendiri.",
    );
  }

  // Guard B: Last Super Admin Guard
  if (validated.role !== "super-admin") {
    const { data: targetProfile } = await adminDb
      .from("profiles")
      .select("role, full_name, nim, is_onboarded")
      .eq("id", validated.userId)
      .single();

    if (targetProfile?.role === "super-admin") {
      const { count } = await adminDb
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
  const { data: oldProfile } = await adminDb
    .from("profiles")
    .select("role, full_name, nim, is_onboarded")
    .eq("id", validated.userId)
    .single();

  const { data: oldReg } = await adminDb
    .from("registrations")
    .select("id, phone_number, study_program_id")
    .eq("profile_id", validated.userId)
    .maybeSingle();

  const nowIso = new Date().toISOString();

  // Mutasi 1: Update tabel profiles
  const { error: profileErr } = await adminDb
    .from("profiles")
    .update({
      full_name: validated.fullName,
      nim: validated.nim || null,
      role: validated.role,
      is_onboarded: validated.isOnboarded,
      updated_at: nowIso,
    })
    .eq("id", validated.userId);

  if (profileErr) {
    throw new Error(`Gagal memperbarui profil pengguna: ${profileErr.message}`);
  }

  // Mutasi 2: Update atau Insert tabel registrations untuk Program Studi & Kontak
  if (oldReg) {
    const { error: regErr } = await adminDb
      .from("registrations")
      .update({
        full_name: validated.fullName,
        phone_number: validated.phoneNumber || "",
        study_program_id: validated.studyProgramId || null,
        updated_at: nowIso,
      })
      .eq("profile_id", validated.userId);

    if (regErr) {
      console.error("Gagal memperbarui tabel registrations:", regErr.message);
      throw new Error(
        `Gagal memperbarui data program studi/pendaftaran: ${regErr.message}`,
      );
    }
  } else {
    // Buat record pendaftaran baru jika belum ada di tabel registrations
    const nickname = validated.fullName.trim().split(" ")[0] || "User";
    const { error: insertErr } = await adminDb.from("registrations").insert({
      profile_id: validated.userId,
      full_name: validated.fullName,
      phone_number: validated.phoneNumber || "",
      study_program_id: validated.studyProgramId || null,
      nickname,
      gender: "L",
      pob: "-",
      dob: "2000-01-01",
      entry_year: new Date().getFullYear(),
      origin_address: "-",
      domicile_address: "-",
      status: "verified",
      updated_at: nowIso,
    });

    if (insertErr) {
      console.error(
        "Gagal membuat record registrations baru:",
        insertErr.message,
      );
      throw new Error(
        `Gagal menyimpan data program studi pengguna: ${insertErr.message}`,
      );
    }
  }

  // Record Immutable Audit Log with automatic PII masking & IP capture
  await recordAuditLog({
    actorId: currentUser.id,
    actionType: "UPDATE_USER_IDENTITY",
    targetUserId: validated.userId,
    oldValue: {
      role: oldProfile?.role,
      fullName: oldProfile?.full_name,
      nim: oldProfile?.nim,
      isOnboarded: oldProfile?.is_onboarded,
      phoneNumber: oldReg?.phone_number,
      studyProgramId: oldReg?.study_program_id,
    },
    newValue: {
      role: validated.role,
      fullName: validated.fullName,
      nim: validated.nim,
      isOnboarded: validated.isOnboarded,
      phoneNumber: validated.phoneNumber,
      studyProgramId: validated.studyProgramId,
    },
    details: `Pembaruan identitas & peran pengguna ${validated.fullName} (${validated.role})`,
  });

  revalidatePath("/manajemen-akun");
  revalidatePath("/admin/users");
  revalidatePath("/audit-log");
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
  const { adminDb, currentUser } = await verifySuperAdminRole();
  const validated = SoftDeleteUserSchema.parse(rawInput);

  // Guard A: Self-Delete Guard
  if (currentUser.id === validated.userId) {
    throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
  }

  // Guard B: Last Super Admin Guard
  const { data: targetProfile } = await adminDb
    .from("profiles")
    .select("role, full_name, deleted_at")
    .eq("id", validated.userId)
    .single();

  if (targetProfile?.role === "super-admin") {
    const { count } = await adminDb
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
  const { error: profileErr } = await adminDb
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
  const { error: regErr } = await adminDb
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

  // Record Immutable Audit Log
  await recordAuditLog({
    actorId: currentUser.id,
    actionType: "SOFT_DELETE_USER",
    targetUserId: validated.userId,
    oldValue: { deleted_at: targetProfile?.deleted_at || null },
    newValue: { deleted_at: nowStr, delete_reason: validated.deleteReason },
    details: `Nonaktifkan akun ${targetProfile?.full_name || validated.userId}. Alasan: ${validated.deleteReason}`,
  });

  revalidatePath("/manajemen-akun");
  revalidatePath("/admin/users");
  revalidatePath("/audit-log");
  revalidatePath("/dashboard");
  return { success: true, message: "Berhasil menonaktifkan akun pengguna." };
}

/**
 * 3. Memulihkan (Restore) Akun Pengguna yang Diarsip
 */
export async function restoreUserAction(rawInput: RestoreUserInput) {
  const { adminDb, currentUser } = await verifySuperAdminRole();
  const validated = RestoreUserSchema.parse(rawInput);

  const { data: targetProfile } = await adminDb
    .from("profiles")
    .select("full_name, deleted_at, delete_reason")
    .eq("id", validated.userId)
    .single();

  const nowStr = new Date().toISOString();

  // Mutasi 1: Restore profiles
  const { error: profileErr } = await adminDb
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
  await adminDb
    .from("registrations")
    .update({
      deleted_at: null,
      delete_reason: null,
      updated_at: nowStr,
    })
    .eq("profile_id", validated.userId);

  // Record Immutable Audit Log
  await recordAuditLog({
    actorId: currentUser.id,
    actionType: "RESTORE_USER",
    targetUserId: validated.userId,
    oldValue: {
      deleted_at: targetProfile?.deleted_at,
      delete_reason: targetProfile?.delete_reason,
    },
    newValue: { deleted_at: null, delete_reason: null },
    details: `Memulihkan akun pengguna ${targetProfile?.full_name || validated.userId}`,
  });

  revalidatePath("/manajemen-akun");
  revalidatePath("/admin/users");
  revalidatePath("/audit-log");
  revalidatePath("/dashboard");
  return { success: true, message: "Berhasil memulihkan akun pengguna." };
}

/**
 * 4. Reset Status Onboarding Pengguna
 */
export async function resetUserOnboardingAction(userId: string) {
  const { adminDb, currentUser } = await verifySuperAdminRole();

  const { data: targetProfile } = await adminDb
    .from("profiles")
    .select("full_name, is_onboarded")
    .eq("id", userId)
    .single();

  const { error } = await adminDb
    .from("profiles")
    .update({
      is_onboarded: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Gagal mereset status onboarding: ${error.message}`);
  }

  // Record Immutable Audit Log
  await recordAuditLog({
    actorId: currentUser.id,
    actionType: "RESET_USER_ONBOARDING",
    targetUserId: userId,
    oldValue: { is_onboarded: targetProfile?.is_onboarded },
    newValue: { is_onboarded: false },
    details: `Reset status onboarding pengguna ${targetProfile?.full_name || userId}`,
  });

  revalidatePath("/manajemen-akun");
  revalidatePath("/admin/users");
  revalidatePath("/audit-log");
  revalidatePath("/dashboard");
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
  const { adminDb } = await verifySuperAdminRole();

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

  let query = adminDb.from("profiles").select(
    `
      id,
      email,
      full_name,
      nim,
      role,
      is_onboarded,
      is_on_internship,
      internship_start_date,
      internship_end_date,
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
    let fallbackQuery = adminDb.from("profiles").select(
      `
      id,
      email,
      full_name,
      nim,
      role,
      is_onboarded,
      is_on_internship,
      internship_start_date,
      internship_end_date,
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
      isOnInternship: row.is_on_internship ?? false,
      internshipStartDate: row.internship_start_date || null,
      internshipEndDate: row.internship_end_date || null,
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
 * 7. Mengambil Log Audit Sistem Terpaginasi dengan Relasi Aktor & Target (Super Admin Only)
 */
export async function getAuditLogsAction(
  page = 1,
  perPage = 15,
): Promise<SystemAuditLogQueryResult> {
  const { adminDb } = await verifySuperAdminRole();

  const from = (page - 1) * perPage;
  const to = page * perPage - 1;

  // Query audit logs with relation join to profiles
  const {
    data: rawData,
    count,
    error,
  } = await adminDb
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
      created_at,
      actor:profiles!system_audit_logs_actor_id_fkey (
        full_name,
        email,
        role,
        avatar_url
      ),
      target_user:profiles!system_audit_logs_target_user_id_fkey (
        full_name,
        email,
        role,
        nim
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error(
      "Gagal membaca audit logs dengan join, mencoba fallback query:",
      error.message,
    );

    // Graceful fallback if relation name lookup varies
    const fallbackResult = await adminDb
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

    if (fallbackResult.error) {
      console.error(
        "Gagal membaca fallback audit logs:",
        fallbackResult.error.message,
      );
      return {
        data: [],
        totalCount: 0,
        page,
        perPage,
        totalPages: 0,
      };
    }

    const fallbackItems: SystemAuditLogEntry[] = (
      fallbackResult.data || []
    ).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        actorId: (row.actor_id as string) || null,
        actorName: null,
        actorEmail: null,
        actorRole: null,
        actorAvatarUrl: null,
        actionType: String(row.action_type),
        targetUserId: (row.target_user_id as string) || null,
        targetUserName: null,
        targetUserEmail: null,
        targetUserRole: null,
        oldValue: (row.old_value as Record<string, unknown>) || null,
        newValue: (row.new_value as Record<string, unknown>) || null,
        details: (row.details as string) || null,
        ipAddress: (row.ip_address as string) || null,
        createdAt: String(row.created_at),
      };
    });

    return {
      data: fallbackItems,
      totalCount: fallbackResult.count || 0,
      page,
      perPage,
      totalPages: Math.ceil((fallbackResult.count || 0) / perPage),
    };
  }

  const items: SystemAuditLogEntry[] = (rawData || []).map((r) => {
    const row = r as Record<string, unknown>;
    const actor = (
      Array.isArray(row.actor) ? row.actor[0] : row.actor
    ) as Record<string, unknown> | null;
    const target = (
      Array.isArray(row.target_user) ? row.target_user[0] : row.target_user
    ) as Record<string, unknown> | null;

    return {
      id: String(row.id),
      actorId: (row.actor_id as string) || null,
      actorName: (actor?.full_name as string) || null,
      actorEmail: (actor?.email as string) || null,
      actorRole: (actor?.role as string) || null,
      actorAvatarUrl: (actor?.avatar_url as string) || null,
      actionType: String(row.action_type),
      targetUserId: (row.target_user_id as string) || null,
      targetUserName: (target?.full_name as string) || null,
      targetUserEmail: (target?.email as string) || null,
      targetUserRole: (target?.role as string) || null,
      oldValue: (row.old_value as Record<string, unknown>) || null,
      newValue: (row.new_value as Record<string, unknown>) || null,
      details: (row.details as string) || null,
      ipAddress: (row.ip_address as string) || null,
      createdAt: String(row.created_at),
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
