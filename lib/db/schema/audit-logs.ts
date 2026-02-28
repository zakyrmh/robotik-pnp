/**
 * Tipe data untuk tabel audit_logs
 *
 * Merepresentasikan satu baris di tabel audit_logs,
 * digunakan untuk mencatat perubahan data di sistem.
 */

/** Tipe aksi yang dicatat */
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

/** Baris audit log dari database */
export interface AuditLog {
  id: string
  actor_id: string | null
  action: AuditAction
  table_name: string
  record_id: string
  summary: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

/** Insert type (subset kolom yang bisa di-insert manual) */
export interface AuditLogInsert {
  actor_id?: string | null
  action: AuditAction
  table_name: string
  record_id: string
  summary?: string | null
  old_data?: Record<string, unknown> | null
  new_data?: Record<string, unknown> | null
}
