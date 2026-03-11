/**
 * Schema Types — Modul Open Recruitment (Pendaftaran Caang)
 *
 * Tipe data TypeScript untuk tabel OR.
 */

// ═══════════════════════════════════════════════════════
// ENUM
// ═══════════════════════════════════════════════════════

export type OrRegistrationStatus =
  | "draft"
  | "submitted"
  | "revision"
  | "accepted" // Lolos Berkas -> Siap Pelatihan dll
  | "rejected"
  | "training"
  | "interview_1"
  | "project_phase"
  | "interview_2"
  | "graduated";

export type OrRegistrationStep =
  | "biodata"
  | "documents"
  | "payment"
  | "completed";

export const OR_REGISTRATION_STATUS_LABELS: Record<
  OrRegistrationStatus,
  string
> = {
  draft: "Draft",
  submitted: "Menunggu Verifikasi",
  revision: "Perlu Revisi",
  accepted: "Lolos Berkas",
  rejected: "Ditolak",
  training: "Masa Pelatihan",
  interview_1: "Wawancara 1",
  project_phase: "Project Seleksi",
  interview_2: "Wawancara 2",
  graduated: "Lulus / Lolos Akhir",
};

export const OR_REGISTRATION_STEP_LABELS: Record<OrRegistrationStep, string> = {
  biodata: "Data Diri",
  documents: "Dokumen",
  payment: "Pembayaran",
  completed: "Lengkap",
};

// ═══════════════════════════════════════════════════════
// INTERFACE: Pendaftaran
// ═══════════════════════════════════════════════════════

/** Data pendaftaran caang */
export interface OrRegistration {
  id: string;
  user_id: string;
  status: OrRegistrationStatus;
  current_step: OrRegistrationStep;

  // Biodata tambahan
  motivation: string | null;
  org_experience: string | null;
  achievements: string | null;
  year_enrolled: number | null;

  // Dokumen
  photo_url: string | null;
  ktm_url: string | null;
  ig_follow_url: string | null;
  ig_mrc_url: string | null;
  yt_sub_url: string | null;

  // Pembayaran
  payment_url: string | null;
  payment_method: string | null;
  payment_amount: number | null;

  // Verifikasi
  submitted_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  revision_fields: string[] | null;

  created_at: string;
  updated_at: string;
}

/** Pendaftaran + info profil + edukasi user */
export interface OrRegistrationWithUser extends OrRegistration {
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
  email: string;
  gender: string | null;
  birth_place: string | null;
  birth_date: string | null;
  phone: string | null;
  address_domicile: string | null;
  // Education
  nim: string | null;
  study_program_name: string | null;
  major_name: string | null;
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Statistik
// ═══════════════════════════════════════════════════════

export interface OrDashboardStats {
  totalRegistrations: number;
  draft: number;
  submitted: number;
  revision: number;
  accepted: number;
  rejected: number;
  blacklisted: number;
}

// ═══════════════════════════════════════════════════════
// INTERFACE: Blacklist (re-export dari user-blacklist.ts)
// ═══════════════════════════════════════════════════════

export interface OrBlacklistWithUser {
  id: string;
  user_id: string;
  admin_id: string;
  reason: string;
  evidence_url: string | null;
  is_permanent: boolean;
  expires_at: string | null;
  created_at: string;
  // User info
  full_name: string;
  nickname: string | null;
  email: string;
  avatar_url: string | null;
}
