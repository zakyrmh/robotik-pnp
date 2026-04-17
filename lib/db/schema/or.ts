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

// ═══════════════════════════════════════════════════════
// MODUL: KEGIATAN & ABSENSI
// ═══════════════════════════════════════════════════════

export type OrEventType =
  | "demo"
  | "pelatihan"
  | "wawancara"
  | "project"
  | "pelantikan"
  | "lainnya";

export type OrEventMode = "offline" | "online" | "hybrid";

export type OrEventStatus = "draft" | "published" | "completed";

export type OrAttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "excused"
  | "sick";

export const OR_EVENT_TYPE_LABELS: Record<OrEventType, string> = {
  demo: "Demo & Perkenalan",
  pelatihan: "Pelatihan",
  wawancara: "Wawancara",
  project: "Project Seleksi",
  pelantikan: "Pelantikan",
  lainnya: "Lainnya",
};

export const OR_EVENT_MODE_LABELS: Record<OrEventMode, string> = {
  offline: "Offline (Tatap Muka)",
  online: "Online (Daring)",
  hybrid: "Hybrid",
};

export const OR_EVENT_STATUS_LABELS: Record<OrEventStatus, string> = {
  draft: "Draft (Internal)",
  published: "Dipublikasikan",
  completed: "Selesai",
};

export const OR_ATTENDANCE_STATUS_LABELS: Record<OrAttendanceStatus, string> = {
  present: "Hadir",
  late: "Terlambat",
  absent: "Alfa / Tidak Hadir",
  excused: "Izin",
  sick: "Sakit",
};

/** Data Kegiatan OR */
export interface OrEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: OrEventType;

  // Jadwal
  event_date: string;
  start_time: string;
  end_time: string | null;

  // Lokasi & Mode
  location: string | null;
  execution_mode: OrEventMode;
  meeting_link: string | null;

  // Fitur & Konfigurasi
  status: OrEventStatus;
  allow_attendance: boolean;
  late_tolerance: number;

  // Poin Konfigurasi
  points_present: number;
  points_late: number;
  points_excused: number;
  points_sick: number;
  points_absent: number;

  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Data Absensi Kegiatan OR */
export interface OrEventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  status: OrAttendanceStatus;
  checked_in_at: string | null;
  notes: string | null;
  points: number;
  created_at: string;
  updated_at: string;
}

/** Data Absensi + Info User */
export interface OrEventAttendanceWithUser extends OrEventAttendance {
  full_name: string;
  nickname: string | null;
  nim: string | null;
  avatar_url: string | null;
}

/** Token QR Absensi */
export interface OrAttendanceToken {
  id: string;
  user_id: string;
  event_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export const OR_PIPELINE_STATUS_LABELS: Record<string, string> = {
  intro_demo: "Pengenalan & Demo Robot",
  interview_1_passed: "Lulus Wawancara 1",
  interview_1_failed: "Tidak Lulus Wawancara 1",
  training: "Pelatihan",
  family_gathering: "Family Gathering",
  project: "Project Robot",
  interview_2_passed: "Lulus Wawancara 2",
  interview_2_failed: "Tidak Lulus Wawancara 2",
  internship_rolling: "Magang Rolling",
  internship_fixed: "Magang Tetap",
  inducted: "Dilantik",
  blacklisted: "Diblokir",
};

// ═══════════════════════════════════════════════════════
// MODUL: MAGANG (FORMULIR MAGANG CAANG)
// ═══════════════════════════════════════════════════════

export interface OrInternshipApplication {
  id: string;
  user_id: string;

  // Step 1
  minat: string;
  alasan_minat: string;
  skill: string;

  // Step 2
  divisi_1_id: string;
  yakin_divisi_1: string;
  alasan_divisi_1: string;

  divisi_2_id: string;
  yakin_divisi_2: string;
  alasan_divisi_2: string;

  // Step 3
  dept_1_id: string;
  yakin_dept_1: string;
  alasan_dept_1: string;

  dept_2_id: string;
  yakin_dept_2: string;
  alasan_dept_2: string;

  // Hasil Algoritma
  recommended_divisi_id: string | null;
  recommended_dept_id: string | null;

  // Final Penempatan (Oleh Admin)
  final_divisi_id: string | null;
  final_dept_id: string | null;

  status: "pending" | "approved" | "rejected";

  is_manual_registration: boolean;

  created_at: string;
  updated_at: string;
}

/** Pengaturan Global Pendaftaran Magang */
export interface OrInternshipSettings {
  is_open: boolean;
  start_date: string | null;
  end_date: string | null;
}

