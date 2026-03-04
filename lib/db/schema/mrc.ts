/**
 * Tipe data untuk tabel mrc_events dan mrc_categories
 *
 * Merepresentasikan event lomba MRC dan kategori
 * yang terdaftar dalam event tersebut.
 */

// ── Status event MRC ──
export const MRC_EVENT_STATUS = [
  'draft',
  'registration',
  'closed',
  'ongoing',
  'completed',
  'cancelled',
] as const
export type MrcEventStatus = (typeof MRC_EVENT_STATUS)[number]

/** Label Bahasa Indonesia untuk setiap status */
export const MRC_STATUS_LABELS: Record<MrcEventStatus, string> = {
  draft: 'Draf',
  registration: 'Pendaftaran Dibuka',
  closed: 'Pendaftaran Ditutup',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

// ── Tipe: MRC Event ──

export interface MrcEvent {
  id: string
  name: string
  slug: string
  description: string | null
  status: MrcEventStatus
  registration_open: string | null
  registration_close: string | null
  event_start: string | null
  event_end: string | null
  venue: string | null
  contact_person: string | null
  contact_phone: string | null
  contact_email: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MrcEventInsert {
  name: string
  slug: string
  description?: string | null
  status?: MrcEventStatus
  registration_open?: string | null
  registration_close?: string | null
  event_start?: string | null
  event_end?: string | null
  venue?: string | null
  contact_person?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  created_by?: string | null
}

export type MrcEventUpdate = Partial<
  Omit<MrcEventInsert, 'slug'> & { slug: string }
>

// ── Tipe: MRC Category ──

export interface MrcCategory {
  id: string
  event_id: string
  name: string
  description: string | null
  rules_url: string | null
  max_team_size: number
  min_team_size: number
  max_teams: number | null
  registration_fee: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MrcCategoryInsert {
  event_id: string
  name: string
  description?: string | null
  rules_url?: string | null
  max_team_size?: number
  min_team_size?: number
  max_teams?: number | null
  registration_fee?: number
  is_active?: boolean
}

export type MrcCategoryUpdate = Partial<Omit<MrcCategoryInsert, 'event_id'>>

// ── Status Tim MRC ──

export const MRC_TEAM_STATUS = [
  'pending',
  'revision',
  'documents_verified',
  'payment_verified',
  'checked_in',
  'rejected',
] as const
export type MrcTeamStatus = (typeof MRC_TEAM_STATUS)[number]

export const MRC_TEAM_STATUS_LABELS: Record<MrcTeamStatus, string> = {
  pending: 'Menunggu Verifikasi',
  revision: 'Perlu Revisi',
  documents_verified: 'Berkas Terverifikasi',
  payment_verified: 'Pembayaran Terverifikasi',
  checked_in: 'Sudah Daftar Ulang',
  rejected: 'Ditolak',
}

// ── Role anggota tim ──

export const MRC_MEMBER_ROLE = ['captain', 'member', 'advisor'] as const
export type MrcMemberRole = (typeof MRC_MEMBER_ROLE)[number]

export const MRC_MEMBER_ROLE_LABELS: Record<MrcMemberRole, string> = {
  captain: 'Ketua Tim',
  member: 'Anggota',
  advisor: 'Pembimbing',
}

// ── Status pembayaran ──

export const MRC_PAYMENT_STATUS = ['pending', 'verified', 'rejected'] as const
export type MrcPaymentStatus = (typeof MRC_PAYMENT_STATUS)[number]

export const MRC_PAYMENT_STATUS_LABELS: Record<MrcPaymentStatus, string> = {
  pending: 'Menunggu Verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
}

// ── Tipe: MRC Team ──

export interface MrcTeam {
  id: string
  event_id: string
  category_id: string
  team_name: string
  institution: string
  captain_name: string
  captain_email: string
  captain_phone: string
  advisor_name: string
  advisor_phone: string | null
  status: MrcTeamStatus
  rejection_reason: string | null
  notes: string | null
  whatsapp_group_url: string | null
  registered_by: string | null
  created_at: string
  updated_at: string
}

// ── Tipe: MRC Team Member ──

export interface MrcTeamMember {
  id: string
  team_id: string
  full_name: string
  role: MrcMemberRole
  identity_number: string | null
  phone: string | null
  created_at: string
}

// ── Tipe: MRC Payment ──

export interface MrcPayment {
  id: string
  team_id: string
  amount: number
  payment_method: string | null
  proof_url: string
  account_name: string | null
  notes: string | null
  status: MrcPaymentStatus
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

// ── Tipe gabungan untuk query JOIN ──

/** Tim beserta kategori, anggota, dan pembayaran terbaru */
export interface MrcTeamFull extends MrcTeam {
  category: { name: string; registration_fee: number } | null
  members: MrcTeamMember[]
  latest_payment: MrcPayment | null
}

// ── Jenis Scan QR ──

export const MRC_SCAN_TYPES = ['checkin', 'entry', 'exit', 'match_verify'] as const
export type MrcScanType = (typeof MRC_SCAN_TYPES)[number]

export const MRC_SCAN_TYPE_LABELS: Record<MrcScanType, string> = {
  checkin: 'Check-in',
  entry: 'Masuk Gedung',
  exit: 'Keluar Gedung',
  match_verify: 'Verifikasi Pertandingan',
}

// ── Tipe: MRC QR Code ──

export interface MrcQrCode {
  id: string
  team_id: string
  member_id: string | null
  qr_token: string
  person_name: string
  person_role: MrcMemberRole
  is_checked_in: boolean
  checked_in_at: string | null
  checked_in_by: string | null
  is_inside: boolean
  created_at: string
}

/** QR code dengan info tim (untuk display tabel) */
export interface MrcQrCodeWithTeam extends MrcQrCode {
  team_name: string
  institution: string
  category_name: string
}

// ── Tipe: MRC Scan Log ──

export interface MrcScanLog {
  id: string
  qr_code_id: string
  scan_type: MrcScanType
  scanned_by: string | null
  is_valid: boolean
  notes: string | null
  scanned_at: string
}

// ── Match Stage (Tahap pertandingan) ──

export const MRC_MATCH_STAGES = [
  'group_stage', 'round_of_16', 'quarterfinal',
  'semifinal', 'third_place', 'final',
] as const
export type MrcMatchStage = (typeof MRC_MATCH_STAGES)[number]

export const MRC_MATCH_STAGE_LABELS: Record<MrcMatchStage, string> = {
  group_stage: 'Fase Grup',
  round_of_16: 'Babak 16 Besar',
  quarterfinal: 'Perempat Final',
  semifinal: 'Semi Final',
  third_place: 'Perebutan Juara 3',
  final: 'Final',
}

// ── Match Status ──

export const MRC_MATCH_STATUS = ['upcoming', 'live', 'finished'] as const
export type MrcMatchStatus = (typeof MRC_MATCH_STATUS)[number]

export const MRC_MATCH_STATUS_LABELS: Record<MrcMatchStatus, string> = {
  upcoming: 'Akan Datang',
  live: 'Sedang Berlangsung',
  finished: 'Selesai',
}

// ── Timer Status ──

export const MRC_TIMER_STATUS = ['stopped', 'running', 'paused'] as const
export type MrcTimerStatus = (typeof MRC_TIMER_STATUS)[number]

// ── Overlay Scene ──

export const MRC_OVERLAY_SCENES = [
  'none', 'match', 'scoreboard', 'bracket',
  'standing', 'coming_up', 'break',
] as const
export type MrcOverlayScene = (typeof MRC_OVERLAY_SCENES)[number]

export const MRC_OVERLAY_SCENE_LABELS: Record<MrcOverlayScene, string> = {
  none: 'Tidak Aktif',
  match: 'Pertandingan',
  scoreboard: 'Papan Skor',
  bracket: 'Bracket Eliminasi',
  standing: 'Klasemen Grup',
  coming_up: 'Pertandingan Selanjutnya',
  break: 'Istirahat',
}

// ── Timer Mode ──

export const MRC_TIMER_MODES = ['none', 'countdown', 'target_time'] as const
export type MrcTimerMode = (typeof MRC_TIMER_MODES)[number]

export const MRC_TIMER_MODE_LABELS: Record<MrcTimerMode, string> = {
  none: 'Tanpa Timer',
  countdown: 'Countdown (Menit)',
  target_time: 'Target Jam (HH:MM)',
}

// ── Tipe: Grup ──

export interface MrcGroup {
  id: string
  event_id: string
  category_id: string
  group_name: string
  created_at: string
}

// ── Tipe: Tim dalam Grup + Standing ──

export interface MrcGroupTeam {
  id: string
  group_id: string
  team_id: string
  played: number
  wins: number
  draws: number
  losses: number
  score_for: number
  score_against: number
  points: number
  rank: number | null
  created_at: string
}

/** Standing grup dengan data tim tergabung */
export interface MrcGroupTeamWithInfo extends MrcGroupTeam {
  team_name: string
  institution: string
}

// ── Tipe: Pertandingan ──

export interface MrcMatch {
  id: string
  event_id: string
  category_id: string
  stage: MrcMatchStage
  group_id: string | null
  bracket_position: number | null
  match_number: number
  team_a_id: string | null
  team_b_id: string | null
  team_a_label: string | null
  team_b_label: string | null
  score_a: number
  score_b: number
  current_round: number
  total_rounds: number
  is_swapped: boolean
  winner_id: string | null
  status: MrcMatchStatus
  timer_duration: number
  timer_remaining: number
  timer_status: MrcTimerStatus
  timer_started_at: string | null
  next_match_id: string | null
  next_match_slot: 'team_a' | 'team_b' | null
  created_at: string
  updated_at: string
}

/** Match dengan info nama tim */
export interface MrcMatchWithTeams extends MrcMatch {
  team_a_name: string
  team_b_name: string
  team_a_institution: string
  team_b_institution: string
  category_name: string
}

// ── Tipe: Skor per Babak ──

export interface MrcMatchRound {
  id: string
  match_id: string
  round_number: number
  score_a: number
  score_b: number
  notes: string | null
  judged_by: string | null
  created_at: string
}

// ── Tipe: Live State (Overlay control) ──

export interface MrcLiveState {
  id: string
  event_id: string
  category_id: string
  active_scene: MrcOverlayScene
  current_match_id: string | null
  coming_up_match_id: string | null
  coming_up_message: string | null
  coming_up_timer_mode: MrcTimerMode
  coming_up_countdown: number | null
  coming_up_target: string | null
  coming_up_timer_status: MrcTimerStatus
  coming_up_started_at: string | null
  break_message: string | null
  break_timer_mode: MrcTimerMode
  break_countdown: number | null
  break_target: string | null
  break_timer_status: MrcTimerStatus
  break_started_at: string | null
  updated_at: string
}

// ── Tipe: Overlay Config ──

export interface OverlayElementPosition {
  x: number
  y: number
  fontSize: number
  color: string
}

export interface MrcOverlayConfig {
  id: string
  event_id: string
  category_id: string
  background_url: string | null
  theme_color: string
  team_a_position: OverlayElementPosition | null
  team_b_position: OverlayElementPosition | null
  score_position: OverlayElementPosition | null
  timer_position: OverlayElementPosition | null
  created_at: string
  updated_at: string
}
