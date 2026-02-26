/**
 * Konfigurasi Navigasi Sidebar Dashboard
 *
 * File ini adalah SINGLE SOURCE OF TRUTH untuk seluruh menu sidebar.
 * Setiap menu group memiliki properti `allowedRoles` yang menentukan
 * role mana saja yang bisa melihat menu tersebut.
 *
 * Mapping role ke panel admin:
 * - super_admin  → Akses ke SEMUA menu + panel khusus Super Admin
 * - admin        → Admin OR (Open Recruitment)
 * - pengurus     → Admin Kestari, Komdis, Divisi (tergantung departemen)
 * - anggota      → Menu dasar anggota
 * - caang        → Menu minimal calon anggota
 *
 * Catatan:
 * Role 'pengurus' mencakup beberapa panel admin (Kestari, Komdis, Divisi, MRC)
 * karena mereka adalah pengurus aktif di departemen/divisi masing-masing.
 * Ke depan, filter bisa diperkuat dengan memeriksa departemen/divisi spesifik.
 */

import type { LucideIcon } from 'lucide-react'
import type { SystemRole } from '@/lib/db/schema/enums'

import {
  Home,
  Settings,
  Users,
  CalendarDays,
  BookOpen,
  FolderKanban,
  Wrench,
  // Kestari
  Sparkles,
  Scale,
  // Komdis
  AlertTriangle,
  FileText,
  // Divisi
  FlaskConical,
  // MRC
  Shield,
  Ticket,
  Trophy,
  // Super Admin
  Crown,
} from 'lucide-react'

// ═════════════════════════════════════════════════════
// TIPE DATA
// ═════════════════════════════════════════════════════

/** Item sub-menu di dalam collapsible */
export interface SidebarSubItem {
  title: string
  href: string
}

/** Item menu utama (bisa punya sub-item) */
export interface SidebarMenuItem {
  title: string
  icon: LucideIcon
  /** Jika tidak ada subItems, href wajib ada */
  href?: string
  /** Sub-menu yang tampil dalam Collapsible */
  subItems?: SidebarSubItem[]
}

/** Grup menu yang memiliki label dan daftar item */
export interface SidebarMenuGroup {
  /** Label grup (ditampilkan sebagai SidebarGroupLabel) */
  label: string
  /** Role yang diizinkan melihat grup ini */
  allowedRoles: readonly SystemRole[]
  /** Daftar item menu dalam grup ini */
  items: SidebarMenuItem[]
}

// ═════════════════════════════════════════════════════
// KONFIGURASI MENU PER ROLE
// ═════════════════════════════════════════════════════

export const SIDEBAR_MENU: SidebarMenuGroup[] = [
  // ── 1. Admin OR (Open Recruitment) ──
  {
    label: 'Open Recruitment',
    allowedRoles: ['admin', 'super_admin'],
    items: [
      {
        title: 'Dashboard OR',
        icon: Home,
        href: '/dashboard/or',
      },
      {
        title: 'Pengaturan OR',
        icon: Settings,
        subItems: [
          { title: 'Periode & Jadwal Pendaftaran', href: '/dashboard/or/pengaturan/periode' },
          { title: 'Keuangan & Rekening', href: '/dashboard/or/pengaturan/keuangan' },
          { title: 'Kontak & Pesan Pengumuman', href: '/dashboard/or/pengaturan/kontak' },
        ],
      },
      {
        title: 'Manajemen Caang',
        icon: Users,
        subItems: [
          { title: 'Verifikasi Pendaftar', href: '/dashboard/or/caang/verifikasi' },
          { title: 'Daftar Blacklist Caang', href: '/dashboard/or/caang/blacklist' },
          { title: 'Database & Edit Data', href: '/dashboard/or/caang/database' },
        ],
      },
      {
        title: 'Kegiatan & Absensi',
        icon: CalendarDays,
        subItems: [
          { title: 'Jadwal Kegiatan', href: '/dashboard/or/kegiatan/jadwal' },
          { title: 'Scan QR / Input Absensi', href: '/dashboard/or/kegiatan/absensi' },
        ],
      },
      {
        title: 'Pustaka & Tugas',
        icon: BookOpen,
        subItems: [
          { title: 'Materi Pembelajaran', href: '/dashboard/or/pustaka/materi' },
          { title: 'Penilaian & Input Nilai', href: '/dashboard/or/pustaka/penilaian' },
        ],
      },
      {
        title: 'Manajemen Kelompok',
        icon: FolderKanban,
        subItems: [
          { title: 'Setup Kelompok & Sub-kelompok', href: '/dashboard/or/kelompok/setup' },
          { title: 'Auto-Generate Anggota', href: '/dashboard/or/kelompok/generate' },
        ],
      },
      {
        title: 'Manajemen Magang',
        icon: Wrench,
        subItems: [
          { title: 'Setup Magang', href: '/dashboard/or/magang/setup' },
          { title: 'Monitoring Logbook', href: '/dashboard/or/magang/logbook' },
        ],
      },
    ],
  },

  // ── 2. Admin Kestari (Kesekretariatan) ──
  {
    label: 'Kesekretariatan',
    allowedRoles: ['pengurus', 'super_admin'],
    items: [
      {
        title: 'Dashboard Kestari',
        icon: Home,
        href: '/dashboard/kestari',
      },
      {
        title: 'Manajemen Piket',
        icon: Sparkles,
        subItems: [
          { title: 'Atur Jadwal Piket', href: '/dashboard/kestari/piket/jadwal' },
          { title: 'Verifikasi Bukti Piket', href: '/dashboard/kestari/piket/verifikasi' },
        ],
      },
      {
        title: 'Sanksi & Denda',
        icon: Scale,
        subItems: [
          { title: 'Daftar Pelanggar Piket', href: '/dashboard/kestari/sanksi/pelanggar' },
          { title: 'Verifikasi Pembayaran Denda', href: '/dashboard/kestari/sanksi/pembayaran' },
        ],
      },
    ],
  },

  // ── 3. Admin Komdis (Komisi Disiplin) ──
  {
    label: 'Komisi Disiplin',
    allowedRoles: ['pengurus', 'super_admin'],
    items: [
      {
        title: 'Dashboard Komdis',
        icon: Home,
        href: '/dashboard/komdis',
      },
      {
        title: 'Kegiatan Resmi UKM',
        icon: CalendarDays,
        subItems: [
          { title: 'Buat Kegiatan', href: '/dashboard/komdis/kegiatan/buat' },
          { title: 'Kelola Absensi', href: '/dashboard/komdis/kegiatan/absensi' },
        ],
      },
      {
        title: 'Pelanggaran & Poin',
        icon: AlertTriangle,
        subItems: [
          { title: 'Input & Edit Poin', href: '/dashboard/komdis/pelanggaran/poin' },
          { title: 'Review Pengurangan Poin', href: '/dashboard/komdis/pelanggaran/review' },
        ],
      },
      {
        title: 'Surat Peringatan (SP)',
        icon: FileText,
        subItems: [
          { title: 'Penerbitan SP Digital', href: '/dashboard/komdis/sp/terbit' },
          { title: 'Riwayat SP Anggota', href: '/dashboard/komdis/sp/riwayat' },
        ],
      },
    ],
  },

  // ── 4. Admin Divisi (Ketua / Wakil Divisi) ──
  {
    label: 'Divisi',
    allowedRoles: ['pengurus', 'anggota', 'super_admin'],
    items: [
      {
        title: 'Dashboard Divisi',
        icon: Home,
        href: '/dashboard/divisi',
      },
      {
        title: 'Logbook Riset',
        icon: FlaskConical,
        subItems: [
          { title: 'Validasi Logbook', href: '/dashboard/divisi/logbook/validasi' },
          { title: 'Terbitkan Logbook', href: '/dashboard/divisi/logbook/publish' },
        ],
      },
    ],
  },

  // ── 5. Panitia / Operator MRC ──
  {
    label: 'MRC',
    allowedRoles: ['pengurus', 'super_admin'],
    items: [
      {
        title: 'Dashboard MRC',
        icon: Home,
        href: '/dashboard/mrc',
      },
      {
        title: 'Pengaturan Lomba',
        icon: Settings,
        subItems: [
          { title: 'Buka/Tutup Pendaftaran', href: '/dashboard/mrc/pengaturan/pendaftaran' },
          { title: 'Kategori Lomba & Biaya', href: '/dashboard/mrc/pengaturan/kategori' },
        ],
      },
      {
        title: 'Verifikasi Peserta',
        icon: Shield,
        subItems: [
          { title: 'Verifikasi Berkas & Tim', href: '/dashboard/mrc/peserta/berkas' },
          { title: 'Verifikasi Pembayaran', href: '/dashboard/mrc/peserta/pembayaran' },
        ],
      },
      {
        title: 'Operasional Hari-H',
        icon: Ticket,
        subItems: [
          { title: 'Pendaftaran Ulang', href: '/dashboard/mrc/operasional/checkin' },
          { title: 'Generate & Cetak QR', href: '/dashboard/mrc/operasional/qr' },
          { title: 'Scan QR Anti-Joki', href: '/dashboard/mrc/operasional/scan' },
        ],
      },
      {
        title: 'Manajemen Pertandingan',
        icon: Trophy,
        subItems: [
          { title: 'Drawing Grup', href: '/dashboard/mrc/pertandingan/drawing' },
          { title: 'Realtime Bracket', href: '/dashboard/mrc/pertandingan/bracket' },
          { title: 'Live Score & OBS', href: '/dashboard/mrc/pertandingan/livescore' },
        ],
      },
    ],
  },

  // ── 6. Super Admin Panel ──
  {
    label: 'Super Admin',
    allowedRoles: ['super_admin'],
    items: [
      {
        title: 'Super Admin Panel',
        icon: Crown,
        href: '/dashboard/admin',
      },
      {
        title: 'Manajemen Akun & Role',
        icon: Users,
        href: '/dashboard/admin/roles',
      },
      {
        title: 'Audit Logs Sistem',
        icon: FileText,
        href: '/dashboard/admin/audit',
      },
    ],
  },
]

// ═════════════════════════════════════════════════════
// UTILITY: Filter menu berdasarkan role user
// ═════════════════════════════════════════════════════

/**
 * Memfilter daftar menu sidebar berdasarkan role yang dimiliki user.
 *
 * @param userRoles - Array nama role yang dimiliki user
 * @returns Array SidebarMenuGroup yang boleh dilihat user
 *
 * @example
 * const visibleMenu = filterMenuByRoles(['admin', 'pengurus'])
 */
export function filterMenuByRoles(userRoles: string[]): SidebarMenuGroup[] {
  return SIDEBAR_MENU.filter((group) =>
    group.allowedRoles.some((role) => userRoles.includes(role))
  )
}
