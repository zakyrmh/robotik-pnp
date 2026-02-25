/**
 * Tipe schema untuk tabel divisions
 *
 * Divisi kontes robot — setiap divisi memiliki
 * role mekanik, elektrikal, dan programmer.
 */

export type Division = {
  id: string;          // uuid
  name: string;
  slug: string;
  created_at: string;  // ISO timestamp
  updated_at: string;
};

export type DivisionInsert = Omit<Division, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DivisionUpdate = Partial<Omit<DivisionInsert, 'id'>>;
