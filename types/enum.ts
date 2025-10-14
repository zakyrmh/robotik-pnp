/**
 * User roles
 */
export enum UserRole {
  ADMIN = 'admin',
  CAANG = 'caang', // Calon Anggota
  MEMBER = 'member', // Anggota resmi
}

/**
 * Status pendaftaran
 */
export enum RegistrationStatus {
  DRAFT = 'draft', // Baru buat akun
  FORM_SUBMITTED = 'form_submitted', // Sudah isi form
  DOCUMENTS_UPLOADED = 'documents_uploaded', // Sudah upload dokumen
  PAYMENT_PENDING = 'payment_pending', // Menunggu verifikasi pembayaran
  VERIFIED = 'verified', // Terverifikasi, bisa ikut seleksi
  REJECTED = 'rejected', // Ditolak
}

/**
 * Fase OR
 */
export enum OrPhase {
  PENDAFTARAN = 'pendaftaran',
  DEMO_ROBOT = 'demo_robot',
  WAWANCARA_1 = 'wawancara_1',
  PELATIHAN = 'pelatihan',
  MRC = 'mrc',
  FAMILY_GATHERING = 'family_gathering',
  PROJECT_LINE_FOLLOWER = 'project_line_follower',
  WAWANCARA_2 = 'wawancara_2',
  MAGANG = 'magang',
  PELANTIKAN = 'pelantikan',
}

/**
 * Status fase user
 */
export enum PhaseStatus {
  LOCKED = 'locked', // Belum bisa akses
  ACTIVE = 'active', // Sedang berjalan
  PASSED = 'passed', // Lulus
  FAILED = 'failed', // Tidak lulus
  SKIPPED = 'skipped', // Diskip (optional phase)
}

/**
 * Tipe aktivitas
 */
export enum ActivityType {
  ORIENTATION = 'orientation', // Demo robot
  INTERVIEW = 'interview', // Wawancara
  TRAINING = 'training', // Pelatihan
  EVENT = 'event', // Family gathering
  PROJECT = 'project', // Project LF
  INTERNSHIP = 'internship', // Magang
  CEREMONY = 'ceremony', // Pelantikan
}

/**
 * Kategori pelatihan
 */
export enum TrainingCategory {
  ELEKTRONIKA = 'elektronika',
  MEKANIK = 'mekanik',
  PEMROGRAMAN = 'pemrograman',
}

/**
 * Mode aktivitas
 */
export enum ActivityMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
  HYBRID = 'hybrid',
}

/**
 * Status absensi
 */
export enum AttendanceStatus {
  PRESENT = 'present', // Hadir
  LATE = 'late', // Terlambat
  EXCUSED = 'excused', // Izin (approved)
  SICK = 'sick', // Sakit (approved)
  ABSENT = 'absent', // Alfa
  PENDING_APPROVAL = 'pending_approval', // Menunggu approval izin/sakit
}

/**
 * Metode absensi
 */
export enum AttendanceMethod {
  QR_CODE = 'qr_code', // CAANG generate QR, admin scan
  MANUAL = 'manual', // Input manual oleh admin
}

/**
 * Tipe tugas
 */
export enum TaskType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
}

/**
 * Tipe submission
 */
export enum SubmissionType {
  FILE = 'file',
  LINK = 'link',
  TEXT = 'text',
}

/**
 * Status tugas
 */
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  LATE_SUBMITTED = 'late_submitted',
  UNDER_REVIEW = 'under_review',
  GRADED = 'graded',
  REVISION_REQUIRED = 'revision_required',
}

/**
 * Metode pembayaran
 */
export enum PaymentMethod {
  TRANSFER = 'transfer',
  E_WALLET = 'e_wallet',
  CASH = 'cash',
}

/**
 * Tipe notifikasi
 */
export enum NotificationType {
  ACTIVITY = 'activity', // Aktivitas baru
  REMINDER = 'reminder', // Reminder H-1
  DEADLINE = 'deadline', // Deadline tugas
  SCHEDULE_CHANGE = 'schedule_change', // Perubahan jadwal
  ANNOUNCEMENT = 'announcement', // Pengumuman
  GRADE = 'grade', // Nilai keluar
  APPROVAL = 'approval', // Approval izin/sakit
}

/**
 * Priority notifikasi
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Channel notifikasi
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  WHATSAPP = 'whatsapp',
}

/**
 * Kategori pengumuman
 */
export enum AnnouncementCategory {
  INFO = 'info',
  WARNING = 'warning',
  URGENT = 'urgent',
  EVENT = 'event',
}

/**
 * Gender
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

/**
 * Divisi UKM
 */
export enum Division {
  ELEKTRONIKA = 'elektronika',
  MEKANIK = 'mekanik',
  PEMROGRAMAN = 'pemrograman',
  MULTIMEDIA = 'multimedia',
  ADMINISTRASI = 'administrasi',
}