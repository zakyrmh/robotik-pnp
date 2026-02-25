/**
 * Tipe schema untuk tabel roles
 *
 * Role RBAC level sistem — mengontrol akses fitur aplikasi.
 * Contoh: super_admin, admin, pengurus, anggota, calon_anggota
 */

export type Role = {
  id: string;                // uuid
  name: string;
  description: string | null;
  created_at: string;        // ISO timestamp
};

export type RoleInsert = Omit<Role, 'id' | 'created_at'> & {
  id?: string;
};

export type RoleUpdate = Partial<Pick<Role, 'name' | 'description'>>;
