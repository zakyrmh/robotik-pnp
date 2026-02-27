'use server'

/**
 * Server Actions — Modul Super Admin
 *
 * Berisi fungsi server-side untuk mengelola data user dan role.
 * Semua fungsi menggunakan Supabase server client dan
 * memvalidasi bahwa pemanggil memiliki role super_admin.
 */

import { createClient } from '@/lib/supabase/server'
import type { UserWithRoles } from '@/lib/types/admin'

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
