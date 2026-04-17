"use server";

/**
 * Server Actions — Modul Admin
 *
 * Guard akses:
 * - requireAuth() dengan cek isBypassRole → hanya super_admin dan admin
 */

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuth,
  isActionError,
  ok,
  fail,
  isBypassRole as checkBypass,
} from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";
import type { UserWithRoles, AuditLogWithActor } from "@/lib/types/admin";

// ── Helper guard: hanya super_admin dan admin ──
async function requireAdmin() {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  if (!checkBypass(auth.claims)) {
    return fail("Akses ditolak. Hanya admin yang dapat melakukan aksi ini.");
  }

  return auth;
}

// ═════════════════════════════════════════════════════
// VALIDASI SCHEMA
// ═════════════════════════════════════════════════════

const updateUserStatusSchema = z.object({
  userId: z.string().uuid("ID user tidak valid"),
  status: z.enum(["active", "inactive", "banned"]),
});

const updateUserRolesSchema = z.object({
  userId: z.string().uuid("ID user tidak valid"),
  roleIds: z
    .array(z.string().uuid())
    .min(1, "User harus memiliki minimal 1 role."),
});

const deleteUserSchema = z.object({
  userId: z.string().uuid("ID user tidak valid"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

const auditLogFiltersSchema = z.object({
  tableName: z.string().optional(),
  action: z.enum(["INSERT", "UPDATE", "DELETE"]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ═════════════════════════════════════════════════════
// USER MANAGEMENT
// ═════════════════════════════════════════════════════

/** Ambil semua user beserta profil dan roles — khusus admin */
export async function getUsers(): Promise<ActionResult<UserWithRoles[]>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        status,
        created_at,
        profiles (
          full_name,
          phone,
          avatar_url
        ),
        user_roles!user_roles_user_id_fkey (
          roles ( name )
        )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getUsers] Supabase error:", error.message);
      return fail("Gagal memuat data user.");
    }

    const users: UserWithRoles[] = (data ?? []).map((row) => {
      const rawProfile = row.profiles;
      const profile = Array.isArray(rawProfile)
        ? (rawProfile[0] ?? null)
        : rawProfile;

      return {
        id: row.id,
        email: row.email,
        status: row.status,
        created_at: row.created_at,
        profiles: profile,
        user_roles: (row.user_roles ?? []).map((ur: { roles: { name: string } | { name: string }[] | null }) => {
          const rawRole = ur.roles;
          return {
            roles: Array.isArray(rawRole) ? (rawRole[0] ?? null) : rawRole,
          };
        }),
      };
    });

    return ok(users);
  } catch (err) {
    console.error("[getUsers]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

/** Ambil semua role sistem — khusus admin */
export async function getAllRoles(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id, name")
      .order("name");

    if (error) return fail("Gagal memuat daftar role.");
    return ok(data ?? []);
  } catch (err) {
    console.error("[getAllRoles]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

/** Update status akun user — khusus admin */
export async function updateUserStatus(
  input: z.infer<typeof updateUserStatusSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const parsed = updateUserStatusSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    // Cegah admin mengubah status dirinya sendiri
    if (auth.userId === parsed.data.userId) {
      return fail("Tidak dapat mengubah status akun sendiri.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("users")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.userId);

    if (error) return fail("Gagal mengubah status user.");
    return ok({ success: true });
  } catch (err) {
    console.error("[updateUserStatus]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

/**
 * Update roles user — khusus admin.
 * Menggunakan RPC untuk atomik: hapus lama + insert baru dalam satu transaksi.
 */
export async function updateUserRoles(
  input: z.infer<typeof updateUserRolesSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const parsed = updateUserRolesSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    // Atomik via RPC — hapus lama + insert baru dalam satu transaksi
    const { error } = await supabase.rpc("replace_user_roles", {
      p_user_id: parsed.data.userId,
      p_role_ids: parsed.data.roleIds,
      p_assigned_by: auth.userId,
    });

    if (error) return fail("Gagal memperbarui role user.");
    return ok({ success: true });
  } catch (err) {
    console.error("[updateUserRoles]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

/** Soft-delete user — khusus admin */
export async function deleteUser(
  input: z.infer<typeof deleteUserSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const parsed = deleteUserSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    // Cegah admin menghapus dirinya sendiri
    if (auth.userId === parsed.data.userId) {
      return fail("Tidak dapat menghapus akun sendiri.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("users")
      .update({
        status: "deleted",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.userId);

    if (error) return fail("Gagal menghapus user.");
    return ok({ success: true });
  } catch (err) {
    console.error("[deleteUser]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

/** Kirim email reset password — khusus admin */
export async function resetUserPassword(
  input: z.infer<typeof resetPasswordSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${siteUrl}/callback?next=/reset-password`,
      },
    );

    if (error) return fail("Gagal mengirim email reset password.");
    return ok({ success: true });
  } catch (err) {
    console.error("[resetUserPassword]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

// ═════════════════════════════════════════════════════
// STATISTIK DASHBOARD
// ═════════════════════════════════════════════════════

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  bannedUsers: number;
  totalRoles: number;
  roleDistribution: { name: string; count: number }[];
}

/** Ambil statistik ringkasan dashboard admin */
export async function getAdminStats(): Promise<ActionResult<AdminStats>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    const [usersResult, rolesResult, roleDistResult] = await Promise.all([
      supabase.from("users").select("status").is("deleted_at", null),
      supabase.from("roles").select("id"),
      supabase.from("user_roles").select("roles ( name )"),
    ]);

    if (usersResult.error) return fail("Gagal memuat statistik user.");

    const users = usersResult.data ?? [];
    const totalRoles = rolesResult.data?.length ?? 0;

    const roleCounts = new Map<string, number>();
    for (const ur of roleDistResult.data ?? []) {
      const roleName = Array.isArray(ur.roles)
        ? ur.roles[0]?.name
        : (ur.roles as { name: string } | null)?.name;
      if (roleName) {
        roleCounts.set(roleName, (roleCounts.get(roleName) ?? 0) + 1);
      }
    }

    return ok({
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      inactiveUsers: users.filter((u) => u.status === "inactive").length,
      bannedUsers: users.filter((u) => u.status === "banned").length,
      totalRoles,
      roleDistribution: Array.from(roleCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    console.error("[getAdminStats]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

export interface RecentUser {
  id: string;
  email: string;
  status: string;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

/** Ambil 5 user terbaru — khusus admin */
export async function getRecentUsers(): Promise<ActionResult<RecentUser[]>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id, email, status, created_at,
        profiles ( full_name, avatar_url )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) return fail("Gagal memuat data pendaftaran terbaru.");

    const users: RecentUser[] = (data ?? []).map((row) => {
      const rawProfile = row.profiles;
      const profile = Array.isArray(rawProfile)
        ? (rawProfile[0] ?? null)
        : rawProfile;
      return {
        id: row.id,
        email: row.email,
        status: row.status,
        created_at: row.created_at,
        profiles: profile,
      };
    });

    return ok(users);
  } catch (err) {
    console.error("[getRecentUsers]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}

// ═════════════════════════════════════════════════════
// AUDIT LOGS
// ═════════════════════════════════════════════════════

export interface AuditLogFilters {
  tableName?: string;
  action?: "INSERT" | "UPDATE" | "DELETE";
  limit?: number;
  offset?: number;
}

/** Ambil audit logs dengan filter opsional — khusus admin */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<ActionResult<{ logs: AuditLogWithActor[]; total: number }>> {
  try {
    const auth = await requireAdmin();
    if (isActionError(auth)) return auth;

    const parsed = auditLogFiltersSchema.safeParse(filters);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const { limit, offset, tableName, action } = parsed.data;
    const supabase = await createClient();

    let query = supabase
      .from("audit_logs")
      .select(
        `
        id, actor_id, action, table_name, record_id,
        summary, old_data, new_data, created_at,
        users!audit_logs_actor_id_fkey (
          profiles ( full_name, avatar_url )
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tableName) query = query.eq("table_name", tableName);
    if (action) query = query.eq("action", action);

    const { data, error, count } = await query;
    if (error) return fail("Gagal memuat audit logs.");

    const logs: AuditLogWithActor[] = (data ?? []).map((row) => {
      const rawUser = row.users;
      const userObj = Array.isArray(rawUser) ? rawUser[0] : rawUser;
      const rawProfile = userObj?.profiles;
      const profile = Array.isArray(rawProfile)
        ? (rawProfile[0] ?? null)
        : (rawProfile ?? null);

      return {
        id: row.id,
        actor_id: row.actor_id,
        action: row.action as AuditLogWithActor["action"],
        table_name: row.table_name,
        record_id: row.record_id,
        summary: row.summary,
        old_data: row.old_data as Record<string, unknown> | null,
        new_data: row.new_data as Record<string, unknown> | null,
        created_at: row.created_at,
        actor_profile: profile,
      };
    });

    return ok({ logs, total: count ?? 0 });
  } catch (err) {
    console.error("[getAuditLogs]", err);
    return fail("Terjadi kesalahan yang tidak terduga.");
  }
}
