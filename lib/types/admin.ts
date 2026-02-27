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
