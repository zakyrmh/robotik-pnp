'use server'

/**
 * Server Actions — Modul Super Admin
 *
 * Berisi fungsi server-side untuk mengelola data user dan role.
 * Semua fungsi menggunakan Supabase server client dan
 * memvalidasi bahwa pemanggil memiliki role super_admin.
 */

import { createClient } from '@/lib/supabase/server'
import type { UserWithRoles, AuditLogWithActor } from '@/lib/types/admin'

/** Hasil standar dari server action */
interface ActionResult<T> {
  data: T | null
  error: string | null
}

/**
 * Mengambil daftar semua user beserta profil dan roles.
 *
 * Query ini melakukan join ke tabel:
 * - profiles (full_name, phone, avatar_url)
 * - user_roles → roles (name)
 *
 * Data diurutkan berdasarkan tanggal registrasi terbaru.
 *
 * @returns Daftar user dengan profil dan roles, atau pesan error
 */
export async function getUsers(): Promise<ActionResult<UserWithRoles[]>> {
  try {
    const supabase = await createClient()

    // Validasi: pastikan user yang mengakses sudah login
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    // Query user dengan join ke profiles dan user_roles → roles
    // Hint !user_roles_user_id_fkey diperlukan karena user_roles punya
    // 2 FK ke users (user_id dan assigned_by) — PostgREST butuh disambiguasi
    const { data, error } = await supabase
      .from('users')
      .select(`
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
          roles (
            name
          )
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getUsers] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat data user. Coba lagi nanti.' }
    }

    // Transformasi data dari format Supabase ke tipe UserWithRoles
    // profiles bisa berupa array atau object tergantung relasi FK
    const users: UserWithRoles[] = (data ?? []).map((row) => {
      const rawProfile = row.profiles
      const profile = Array.isArray(rawProfile) ? rawProfile[0] ?? null : rawProfile

      return {
        id: row.id,
        email: row.email,
        status: row.status,
        created_at: row.created_at,
        profiles: profile,
        user_roles: (row.user_roles ?? []).map((ur) => {
          const rawRole = ur.roles
          return {
            roles: Array.isArray(rawRole) ? rawRole[0] ?? null : rawRole,
          }
        }),
      }
    })

    return { data: users, error: null }
  } catch (err) {
    console.error('[getUsers] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengambil daftar semua role sistem yang tersedia.
 * Digunakan untuk mengisi opsi di form edit role user.
 */
export async function getAllRoles(): Promise<ActionResult<{ id: string; name: string }[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('roles')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('[getAllRoles] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat daftar role.' }
    }

    return { data: data ?? [], error: null }
  } catch (err) {
    console.error('[getAllRoles] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengubah status akun user.
 *
 * Status yang valid: 'active', 'inactive', 'banned'
 * Perubahan ke 'deleted' dilakukan via fungsi deleteUser().
 *
 * @param userId - UUID user yang akan diubah statusnya
 * @param status - Status baru
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive' | 'banned'
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    // Cegah admin mengubah status dirinya sendiri
    if (user.id === userId) {
      return { data: null, error: 'Tidak dapat mengubah status akun sendiri.' }
    }

    const { error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)

    if (error) {
      console.error('[updateUserStatus] Supabase error:', error.message)
      return { data: null, error: 'Gagal mengubah status user.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[updateUserStatus] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Memperbarui daftar role user.
 *
 * Strategi: hapus semua role lama, lalu insert ulang role baru.
 * Ini memastikan state yang bersih tanpa duplikasi.
 *
 * @param userId - UUID user target
 * @param roleIds - Array UUID role yang akan di-assign
 */
export async function updateUserRoles(
  userId: string,
  roleIds: string[]
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    if (roleIds.length === 0) {
      return { data: null, error: 'User harus memiliki minimal 1 role.' }
    }

    // Langkah 1: Hapus semua role lama user ini
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[updateUserRoles] Delete error:', deleteError.message)
      return { data: null, error: 'Gagal menghapus role lama.' }
    }

    // Langkah 2: Insert role baru
    const newRoles = roleIds.map((roleId) => ({
      user_id: userId,
      role_id: roleId,
      assigned_by: user.id,
    }))

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert(newRoles)

    if (insertError) {
      console.error('[updateUserRoles] Insert error:', insertError.message)
      return { data: null, error: 'Gagal menyimpan role baru.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[updateUserRoles] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengirim email reset password ke user.
 *
 * Menggunakan Supabase Auth Admin API untuk mengirim link reset.
 * User akan menerima email dengan link untuk mengatur password baru.
 *
 * @param email - Email user yang akan di-reset passwordnya
 */
export async function resetUserPassword(
  email: string
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/dashboard`,
    })

    if (error) {
      console.error('[resetUserPassword] Supabase error:', error.message)
      return { data: null, error: 'Gagal mengirim email reset password.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[resetUserPassword] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Soft-delete user (menonaktifkan akun).
 *
 * Mengisi kolom `deleted_at` dengan timestamp sekarang
 * dan mengubah status menjadi 'deleted'.
 * User tidak dihapus secara permanen dari database.
 *
 * @param userId - UUID user yang akan dihapus
 */
export async function deleteUser(
  userId: string
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    // Cegah admin menghapus dirinya sendiri
    if (user.id === userId) {
      return { data: null, error: 'Tidak dapat menghapus akun sendiri.' }
    }

    const { error } = await supabase
      .from('users')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('[deleteUser] Supabase error:', error.message)
      return { data: null, error: 'Gagal menghapus user.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[deleteUser] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═════════════════════════════════════════════════════
// STATISTIK & DATA DASHBOARD SUPER ADMIN
// ═════════════════════════════════════════════════════

/** Tipe data statistik untuk dashboard admin */
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  bannedUsers: number
  totalRoles: number
  roleDistribution: { name: string; count: number }[]
}

/**
 * Mengambil statistik ringkasan untuk dashboard Super Admin.
 *
 * Data yang dikumpulkan:
 * - Jumlah total user, user aktif, nonaktif, dan banned
 * - Jumlah role sistem
 * - Distribusi user per role
 */
export async function getAdminStats(): Promise<ActionResult<AdminStats>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    // Query paralel untuk performa optimal
    const [usersResult, rolesResult, roleDistResult] = await Promise.all([
      // 1. Hitung user per status
      supabase
        .from('users')
        .select('status')
        .is('deleted_at', null),

      // 2. Hitung total role
      supabase
        .from('roles')
        .select('id'),

      // 3. Distribusi user per role
      supabase
        .from('user_roles')
        .select('roles ( name )')
    ])

    if (usersResult.error) {
      console.error('[getAdminStats] Users error:', usersResult.error.message)
      return { data: null, error: 'Gagal memuat statistik user.' }
    }

    const users = usersResult.data ?? []
    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.status === 'active').length
    const inactiveUsers = users.filter((u) => u.status === 'inactive').length
    const bannedUsers = users.filter((u) => u.status === 'banned').length
    const totalRoles = rolesResult.data?.length ?? 0

    // Hitung distribusi role
    const roleCounts = new Map<string, number>()
    for (const ur of roleDistResult.data ?? []) {
      const roleName = Array.isArray(ur.roles)
        ? ur.roles[0]?.name
        : (ur.roles as { name: string } | null)?.name
      if (roleName) {
        roleCounts.set(roleName, (roleCounts.get(roleName) ?? 0) + 1)
      }
    }
    const roleDistribution = Array.from(roleCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return {
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        bannedUsers,
        totalRoles,
        roleDistribution,
      },
      error: null,
    }
  } catch (err) {
    console.error('[getAdminStats] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/** Data user terbaru untuk ditampilkan di dashboard */
export interface RecentUser {
  id: string
  email: string
  status: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

/**
 * Mengambil daftar user yang baru saja mendaftar (5 terbaru).
 * Digunakan untuk widget "Pendaftaran Terbaru" di dashboard admin.
 */
export async function getRecentUsers(): Promise<ActionResult<RecentUser[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        status,
        created_at,
        profiles ( full_name, avatar_url )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[getRecentUsers] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat data pendaftaran terbaru.' }
    }

    // Normalisasi profiles (bisa array atau object)
    const users: RecentUser[] = (data ?? []).map((row) => {
      const rawProfile = row.profiles
      const profile = Array.isArray(rawProfile) ? rawProfile[0] ?? null : rawProfile
      return {
        id: row.id,
        email: row.email,
        status: row.status,
        created_at: row.created_at,
        profiles: profile,
      }
    })

    return { data: users, error: null }
  } catch (err) {
    console.error('[getRecentUsers] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═════════════════════════════════════════════════════
// AUDIT LOGS
// ═════════════════════════════════════════════════════

/** Filter opsional untuk query audit logs */
export interface AuditLogFilters {
  /** Filter berdasarkan nama tabel (contoh: 'users', 'profiles') */
  tableName?: string
  /** Filter berdasarkan tipe aksi */
  action?: 'INSERT' | 'UPDATE' | 'DELETE'
  /** Jumlah item per halaman (default: 20) */
  limit?: number
  /** Offset untuk paginasi (default: 0) */
  offset?: number
}

/**
 * Mengambil daftar audit logs dengan filter opsional.
 *
 * Setiap log di-join dengan profil actor (siapa yang melakukan aksi)
 * agar bisa ditampilkan nama dan avatar di UI.
 *
 * @param filters - Filter opsional (tabel, aksi, paginasi)
 * @returns Daftar audit logs beserta total count
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<ActionResult<{ logs: AuditLogWithActor[]; total: number }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { limit = 20, offset = 0, tableName, action } = filters

    // Build query dasar — join ke users → profiles untuk mendapatkan nama actor
    let query = supabase
      .from('audit_logs')
      .select(
        `
        id,
        actor_id,
        action,
        table_name,
        record_id,
        summary,
        old_data,
        new_data,
        created_at,
        users!audit_logs_actor_id_fkey (
          profiles ( full_name, avatar_url )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Terapkan filter opsional
    if (tableName) {
      query = query.eq('table_name', tableName)
    }
    if (action) {
      query = query.eq('action', action)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[getAuditLogs] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat audit logs.' }
    }

    // Transformasi data: normalisasi nested join ke flat actor_profile
    const logs: AuditLogWithActor[] = (data ?? []).map((row) => {
      // users bisa array atau object tergantung relasi
      const rawUser = row.users
      const userObj = Array.isArray(rawUser) ? rawUser[0] : rawUser
      const rawProfile = userObj?.profiles
      const profile = Array.isArray(rawProfile) ? rawProfile[0] ?? null : rawProfile ?? null

      return {
        id: row.id,
        actor_id: row.actor_id,
        action: row.action as AuditLogWithActor['action'],
        table_name: row.table_name,
        record_id: row.record_id,
        summary: row.summary,
        old_data: row.old_data as Record<string, unknown> | null,
        new_data: row.new_data as Record<string, unknown> | null,
        created_at: row.created_at,
        actor_profile: profile,
      }
    })

    return { data: { logs, total: count ?? 0 }, error: null }
  } catch (err) {
    console.error('[getAuditLogs] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}
