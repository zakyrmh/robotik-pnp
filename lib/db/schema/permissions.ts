/**
 * Tipe schema untuk tabel permissions
 *
 * Permission granular per fitur aplikasi.
 * Format penamaan: <modul>:<aksi>
 * Contoh: 'member:read', 'or:verify_payment'
 */

export type Permission = {
  id: string;                // uuid
  name: string;              // format: modul:aksi
  description: string | null;
  created_at: string;        // ISO timestamp
};

export type PermissionInsert = Omit<Permission, 'id' | 'created_at'> & {
  id?: string;
};

export type PermissionUpdate = Partial<Pick<Permission, 'name' | 'description'>>;
