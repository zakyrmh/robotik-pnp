/**
 * Schema Types — Modul Komisi Disiplin (Kegiatan & Absensi)
 *
 * Tipe data TypeScript untuk tabel komdis.
 */

// ═══════════════════════════════════════════════════════
// ENUM
// ═══════════════════════════════════════════════════════

export type KomdisEventStatus = 'draft' | 'upcoming' | 'ongoing' | 'completed'
export type KomdisAttendanceStatus = 'present' | 'late' | 'absent'
export type KomdisSanctionType = 'physical' | 'points'

export const KOMDIS_EVENT_STATUS_LABELS: Record<KomdisEventStatus, string> = {
  draft: 'Draft',
  upcoming: 'Akan Datang',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
}

export const KOMDIS_ATTENDANCE_STATUS_LABELS: Record<KomdisAttendanceStatus, string> = {
  present: 'Hadir',
  late: 'Terlambat',
  absent: 'Tidak Hadir',
}

export const KOMDIS_SANCTION_TYPE_LABELS: Record<KomdisSanctionType, string> = {
  physical: 'Sanksi Fisik',
  points: 'Penambahan Poin',
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Tabel utama
// ═══════════════════════════════════════════════════════

/** Kegiatan resmi UKM */
export interface KomdisEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  event_date: string
  start_time: string
  end_time: string | null
  status: KomdisEventStatus
  late_tolerance: number
  points_per_late: number
  created_by: string
  created_at: string
  updated_at: string
}

/** QR Token dinamis (5 menit) */
export interface KomdisAttendanceToken {
  id: string
  event_id: string
  user_id: string
  token: string
  expires_at: string
  is_used: boolean
  used_at: string | null
  created_at: string
}

/** Catatan kehadiran */
export interface KomdisAttendance {
  id: string
  event_id: string
  user_id: string
  status: KomdisAttendanceStatus
  scanned_at: string
  is_late: boolean
  late_minutes: number
  scanned_by: string | null
  created_at: string
}

/** Kehadiran + info profil user */
export interface KomdisAttendanceWithUser extends KomdisAttendance {
  full_name: string
  nickname: string | null
  avatar_url: string | null
  email: string
  // Sanksi (jika ada)
  sanction?: KomdisSanction | null
}

/** Sanksi keterlambatan */
export interface KomdisSanction {
  id: string
  event_id: string
  user_id: string
  attendance_id: string
  sanction_type: KomdisSanctionType
  points: number
  notes: string | null
  given_by: string
  created_at: string
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Statistik
// ═══════════════════════════════════════════════════════

export interface KomdisEventStats {
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalSanctionPoints: number
  totalSanctionPhysical: number
}

// ═══════════════════════════════════════════════════════
// ENUM: Pelanggaran & Poin
// ═══════════════════════════════════════════════════════

export type KomdisViolationCategory = 'attendance' | 'discipline' | 'property' | 'ethics' | 'other'
export type KomdisReductionStatus = 'pending' | 'approved' | 'rejected'

export const KOMDIS_VIOLATION_CATEGORY_LABELS: Record<KomdisViolationCategory, string> = {
  attendance: 'Kehadiran',
  discipline: 'Disiplin',
  property: 'Properti',
  ethics: 'Etika',
  other: 'Lainnya',
}

export const KOMDIS_REDUCTION_STATUS_LABELS: Record<KomdisReductionStatus, string> = {
  pending: 'Menunggu Review',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Pelanggaran & Poin
// ═══════════════════════════════════════════════════════

/** Catatan pelanggaran */
export interface KomdisViolation {
  id: string
  user_id: string
  category: KomdisViolationCategory
  description: string
  points: number
  event_id: string | null
  sanction_id: string | null
  given_by: string
  created_at: string
  updated_at: string
}

/** Pelanggaran + info user */
export interface KomdisViolationWithUser extends KomdisViolation {
  full_name: string
  nickname: string | null
  avatar_url: string | null
  email: string
  event_title?: string | null
}

/** Pengajuan pengurangan poin */
export interface KomdisPointReduction {
  id: string
  user_id: string
  points: number
  reason: string
  evidence_url: string | null
  status: KomdisReductionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  approved_points: number | null
  created_at: string
  updated_at: string
}

/** Pengajuan + info user */
export interface KomdisPointReductionWithUser extends KomdisPointReduction {
  full_name: string
  nickname: string | null
  avatar_url: string | null
  email: string
}

/** Ringkasan poin per anggota */
export interface KomdisMemberPointSummary {
  user_id: string
  full_name: string
  nickname: string | null
  avatar_url: string | null
  email: string
  total_violations: number
  total_points: number
  total_reductions: number
  net_points: number
}

// ═══════════════════════════════════════════════════════
// ENUM: Surat Peringatan (SP)
// ═══════════════════════════════════════════════════════

export type KomdisSpLevel = 'sp1' | 'sp2' | 'sp3'
export type KomdisSpStatus = 'draft' | 'issued' | 'acknowledged' | 'revoked'

export const KOMDIS_SP_LEVEL_LABELS: Record<KomdisSpLevel, string> = {
  sp1: 'SP-1 (Teguran Ringan)',
  sp2: 'SP-2 (Teguran Keras)',
  sp3: 'SP-3 (Skorsing/Pemberhentian)',
}

export const KOMDIS_SP_LEVEL_SHORT: Record<KomdisSpLevel, string> = {
  sp1: 'SP-1',
  sp2: 'SP-2',
  sp3: 'SP-3',
}

export const KOMDIS_SP_STATUS_LABELS: Record<KomdisSpStatus, string> = {
  draft: 'Draft',
  issued: 'Diterbitkan',
  acknowledged: 'Telah Dibaca',
  revoked: 'Dicabut',
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Surat Peringatan
// ═══════════════════════════════════════════════════════

/** Surat Peringatan */
export interface KomdisWarningLetter {
  id: string
  user_id: string
  letter_number: string
  level: KomdisSpLevel
  status: KomdisSpStatus
  subject: string
  reason: string
  violations_summary: string | null
  consequences: string | null
  issued_date: string | null
  effective_date: string | null
  expiry_date: string | null
  points_at_issue: number
  acknowledged_at: string | null
  issued_by: string
  revoked_by: string | null
  revoked_at: string | null
  revoke_reason: string | null
  created_at: string
  updated_at: string
}

/** SP + info user */
export interface KomdisWarningLetterWithUser extends KomdisWarningLetter {
  full_name: string
  nickname: string | null
  avatar_url: string | null
  email: string
}
