/**
 * Schema Types — Modul Kesekretariatan (Piket & Denda)
 *
 * Tipe data TypeScript yang merepresentasikan tabel database
 * untuk sistem piket dan sanksi denda.
 */

// ═══════════════════════════════════════════════════════
// ENUM
// ═══════════════════════════════════════════════════════

export type PiketSubmissionStatus = 'pending' | 'approved' | 'rejected'
export type PiketFineStatus = 'unpaid' | 'pending_verification' | 'paid' | 'waived'

export const PIKET_SUBMISSION_STATUS_LABELS: Record<PiketSubmissionStatus, string> = {
  pending: 'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const PIKET_FINE_STATUS_LABELS: Record<PiketFineStatus, string> = {
  unpaid: 'Belum Bayar',
  pending_verification: 'Menunggu Verifikasi',
  paid: 'Lunas',
  waived: 'Dibebaskan',
}

export const WEEK_LABELS: Record<number, string> = {
  1: 'Minggu ke-1',
  2: 'Minggu ke-2',
  3: 'Minggu ke-3',
  4: 'Minggu ke-4',
  5: 'Minggu ke-5',
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Tabel utama
// ═══════════════════════════════════════════════════════

/** Periode piket (1 per masa jabatan) */
export interface PiketPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  fine_amount: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

/** Jadwal piket per anggota */
export interface PiketAssignment {
  id: string
  period_id: string
  user_id: string
  assigned_week: number
  created_at: string
  updated_at: string
}

/** Jadwal piket + info profil user */
export interface PiketAssignmentWithUser extends PiketAssignment {
  full_name: string
  nickname: string | null
  avatar_url: string | null
  email: string
}

/** Bukti piket yang disubmit */
export interface PiketSubmission {
  id: string
  assignment_id: string
  user_id: string
  submitted_at: string
  piket_date: string
  month_year: string
  photo_before_url: string | null
  photo_after_url: string | null
  notes: string | null
  status: PiketSubmissionStatus
  verified_by: string | null
  verified_at: string | null
  reject_reason: string | null
  created_at: string
  updated_at: string
}

/** Bukti piket + info user */
export interface PiketSubmissionWithUser extends PiketSubmission {
  full_name: string
  nickname: string | null
  avatar_url: string | null
  assigned_week: number
}

/** Denda piket */
export interface PiketFine {
  id: string
  assignment_id: string
  user_id: string
  month_year: string
  amount: number
  reason: string
  status: PiketFineStatus
  payment_proof_url: string | null
  paid_at: string | null
  verified_by: string | null
  verified_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/** Denda + info user */
export interface PiketFineWithUser extends PiketFine {
  full_name: string
  nickname: string | null
  avatar_url: string | null
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Statistik Dashboard
// ═══════════════════════════════════════════════════════

export interface PiketDashboardStats {
  totalMembers: number
  totalAssigned: number
  submittedThisMonth: number
  pendingVerification: number
  approvedThisMonth: number
  rejectedThisMonth: number
  unpaidFines: number
  totalFineAmount: number
}
