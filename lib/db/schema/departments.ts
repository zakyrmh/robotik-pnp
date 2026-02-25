/**
 * Tipe schema untuk tabel departments
 *
 * Departemen organisasi UKM Robotik PNP dengan hierarki
 * (parent_id untuk sub-departemen).
 */

export type Department = {
  id: string;                  // uuid
  parent_id: string | null;    // null = departemen utama
  name: string;
  slug: string;
  created_at: string;          // ISO timestamp
  updated_at: string;
};

export type DepartmentInsert = Omit<Department, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DepartmentUpdate = Partial<Omit<DepartmentInsert, 'id'>>;
