/**
 * Tipe data untuk halaman Super Admin
 *
 * Mendefinisikan tipe yang digunakan di seluruh modul admin,
 * termasuk data user yang sudah di-join dengan profil dan role.
 */

/** Data user yang sudah di-join dengan profil dan roles */
export interface UserWithRoles {
  id: string
  email: string
  status: string
  created_at: string
  /** Profil user (bisa null jika belum lengkap) */
  profiles: {
    full_name: string
    phone: string | null
    avatar_url: string | null
  } | null
  /** Daftar role yang dimiliki user */
  user_roles: {
    roles: {
      name: string
    } | null
  }[]
}

/** Audit log yang sudah di-join dengan profil actor */
export interface AuditLogWithActor {
  id: string
  actor_id: string | null
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  table_name: string
  record_id: string
  summary: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
  /** Profil user yang melakukan aksi (null jika sistem) */
  actor_profile: {
    full_name: string
    avatar_url: string | null
  } | null
}
