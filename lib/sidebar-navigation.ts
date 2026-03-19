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

import type { LucideIcon } from "lucide-react";
import type { SystemRole } from "@/lib/db/schema/enums";

import {
  Home,
  Settings,
  Users,
  CalendarDays,
  BookOpen,
  FolderKanban,
  Wrench,
  ClipboardCheck,
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
  Video,
  // Super Admin
  Crown,
} from "lucide-react";

// ═════════════════════════════════════════════════════
// TIPE DATA
// ═════════════════════════════════════════════════════

/** Item sub-menu di dalam collapsible */
export interface SidebarSubItem {
  title: string;
  href: string;
}

/** Item menu utama (bisa punya sub-item) */
export interface SidebarMenuItem {
  title: string;
  icon: LucideIcon;
  /** Jika tidak ada subItems, href wajib ada */
  href?: string;
  /** Sub-menu yang tampil dalam Collapsible */
  subItems?: SidebarSubItem[];
  /** Jika true, item ini hanya muncul untuk caang yang sudah diterima (accepted+) */
  requiresAcceptedCaang?: boolean;
}

/** Grup menu yang memiliki label dan daftar item */
export interface SidebarMenuGroup {
  /** Label grup (ditampilkan sebagai SidebarGroupLabel) */
  label: string;
  /** Role yang diizinkan melihat grup ini */
  allowedRoles: readonly SystemRole[];
  /** Daftar item menu dalam grup ini */
  items: SidebarMenuItem[];
}

// ═════════════════════════════════════════════════════
// KONFIGURASI MENU PER ROLE
// ═════════════════════════════════════════════════════

export const SIDEBAR_MENU: SidebarMenuGroup[] = [
  // ── 0. Calon Anggota (Caang) ──
  // Menu caang difilter berdasarkan status registrasi:
  // - draft/submitted/revision: hanya Dashboard Caang
  // - rejected: hanya Dashboard Caang
  // - accepted/training/interview_1/project_phase/interview_2/graduated: semua menu
  {
    label: "Calon Anggota",
    allowedRoles: ["caang"],
    items: [
      {
        title: "Dashboard Caang",
        icon: Home,
        href: "/dashboard",
      },
      {
        title: "Tugas & Project",
        icon: FolderKanban,
        href: "/dashboard/caang/tugas",
        requiresAcceptedCaang: true,
      },
      {
        title: "Jadwal & Kegiatan",
        icon: CalendarDays,
        href: "/dashboard/caang/kegiatan",
        requiresAcceptedCaang: true,
      },
      {
        title: "Kelompok Seleksi",
        icon: Users,
        href: "/dashboard/caang/kelompok",
        requiresAcceptedCaang: true,
      },
      {
        title: "Pustaka Materi",
        icon: BookOpen,
        href: "/dashboard/caang/pustaka",
        requiresAcceptedCaang: true,
      },
      {
        title: "Rekap Absensi",
        icon: ClipboardCheck,
        href: "/dashboard/caang/absensi",
        requiresAcceptedCaang: true,
      },
      {
        title: "Magang",
        icon: FlaskConical,
        href: "/dashboard/caang/magang",
        requiresAcceptedCaang: true,
      },
    ],
  },

  // ── 1. Admin OR (Open Recruitment) ──
  {
    label: "Open Recruitment",
    allowedRoles: ["admin", "super_admin"],
    items: [
      {
        title: "Dashboard OR",
        icon: Home,
        href: "/dashboard/or",
      },
      {
        title: "Pengaturan OR",
        icon: Settings,
        subItems: [
          {
            title: "Periode & Jadwal Pendaftaran",
            href: "/dashboard/or/pengaturan/periode",
          },
          {
            title: "Keuangan & Rekening",
            href: "/dashboard/or/pengaturan/keuangan",
          },
          {
            title: "Kontak & Pesan Pengumuman",
            href: "/dashboard/or/pengaturan/kontak",
          },
          {
            title: "Link Komunitas",
            href: "/dashboard/or/pengaturan/komunitas",
          },
          {
            title: "Timeline Seleksi",
            href: "/dashboard/or/pengaturan/timeline",
          },
        ],
      },
      {
        title: "Manajemen Caang",
        icon: Users,
        subItems: [
          {
            title: "Verifikasi Pendaftar",
            href: "/dashboard/or/caang/verifikasi",
          },
          {
            title: "Daftar Blacklist Caang",
            href: "/dashboard/or/caang/blacklist",
          },
          {
            title: "Database & Edit Data",
            href: "/dashboard/or/caang/database",
          },
        ],
      },
      {
        title: "Kegiatan & Absensi",
        icon: CalendarDays,
        subItems: [
          { title: "Jadwal Kegiatan", href: "/dashboard/or/kegiatan/jadwal" },
          {
            title: "Scan QR / Input Absensi",
            href: "/dashboard/or/kegiatan/absensi",
          },
          {
            title: "Rekapitulasi Poin",
            href: "/dashboard/or/rekapitulasi",
          },
        ],
      },
      {
        title: "Pustaka & Tugas",
        icon: BookOpen,
        subItems: [
          {
            title: "Materi Pembelajaran",
            href: "/dashboard/or/pustaka/materi",
          },
          {
            title: "Penilaian & Input Nilai",
            href: "/dashboard/or/pustaka/penilaian",
          },
        ],
      },
      {
        title: "Manajemen Kelompok",
        icon: FolderKanban,
        subItems: [
          {
            title: "Setup Kelompok & Sub-kelompok",
            href: "/dashboard/or/kelompok/setup",
          },
          {
            title: "Auto-Generate Anggota",
            href: "/dashboard/or/kelompok/generate",
          },
        ],
      },
      {
        title: "Manajemen Magang",
        icon: Wrench,
        subItems: [
          { title: "Setup Magang", href: "/dashboard/or/magang/setup" },
          { title: "Monitoring Logbook", href: "/dashboard/or/magang/logbook" },
        ],
      },
    ],
  },

  // ── 2. Admin Kestari (Kesekretariatan) ──
  {
    label: "Kesekretariatan",
    allowedRoles: ["pengurus", "super_admin"],
    items: [
      {
        title: "Dashboard Kestari",
        icon: Home,
        href: "/dashboard/kestari",
      },
      {
        title: "Manajemen Piket",
        icon: Sparkles,
        subItems: [
          {
            title: "Atur Jadwal Piket",
            href: "/dashboard/kestari/piket/jadwal",
          },
          {
            title: "Verifikasi Bukti Piket",
            href: "/dashboard/kestari/piket/verifikasi",
          },
        ],
      },
      {
        title: "Sanksi & Denda",
        icon: Scale,
        subItems: [
          {
            title: "Daftar Pelanggar Piket",
            href: "/dashboard/kestari/sanksi/pelanggar",
          },
          {
            title: "Verifikasi Pembayaran Denda",
            href: "/dashboard/kestari/sanksi/pembayaran",
          },
        ],
      },
    ],
  },

  // ── 3. Admin Komdis (Komisi Disiplin) ──
  {
    label: "Komisi Disiplin",
    allowedRoles: ["pengurus", "super_admin"],
    items: [
      {
        title: "Dashboard Komdis",
        icon: Home,
        href: "/dashboard/komdis",
      },
      {
        title: "Kegiatan Resmi UKM",
        icon: CalendarDays,
        subItems: [
          { title: "Buat Kegiatan", href: "/dashboard/komdis/kegiatan/buat" },
          {
            title: "Kelola Absensi",
            href: "/dashboard/komdis/kegiatan/absensi",
          },
        ],
      },
      {
        title: "Pelanggaran & Poin",
        icon: AlertTriangle,
        subItems: [
          {
            title: "Input & Edit Poin",
            href: "/dashboard/komdis/pelanggaran/poin",
          },
          {
            title: "Review Pengurangan Poin",
            href: "/dashboard/komdis/pelanggaran/review",
          },
        ],
      },
      {
        title: "Surat Peringatan (SP)",
        icon: FileText,
        subItems: [
          {
            title: "Penerbitan SP Digital",
            href: "/dashboard/komdis/sp/terbit",
          },
          { title: "Riwayat SP Anggota", href: "/dashboard/komdis/sp/riwayat" },
        ],
      },
    ],
  },

  // ── 4. Admin Divisi (Ketua / Wakil Divisi) ──
  {
    label: "Divisi",
    allowedRoles: ["pengurus", "anggota", "super_admin"],
    items: [
      {
        title: "Dashboard Divisi",
        icon: Home,
        href: "/dashboard/divisi",
      },
      {
        title: "Logbook Riset",
        icon: FlaskConical,
        subItems: [
          {
            title: "Validasi Logbook",
            href: "/dashboard/divisi/logbook/validasi",
          },
          {
            title: "Terbitkan Logbook",
            href: "/dashboard/divisi/logbook/publish",
          },
        ],
      },
    ],
  },

  // ── 5. Panitia / Operator MRC ──
  {
    label: "MRC",
    allowedRoles: ["pengurus", "super_admin"],
    items: [
      {
        title: "Dashboard MRC",
        icon: Home,
        href: "/dashboard/mrc",
      },
      {
        title: "Pengaturan Lomba",
        icon: Settings,
        subItems: [
          {
            title: "Buka/Tutup Pendaftaran",
            href: "/dashboard/mrc/pengaturan/pendaftaran",
          },
          {
            title: "Kategori Lomba & Biaya",
            href: "/dashboard/mrc/pengaturan/kategori",
          },
        ],
      },
      {
        title: "Verifikasi Peserta",
        icon: Shield,
        subItems: [
          {
            title: "Verifikasi Berkas & Tim",
            href: "/dashboard/mrc/peserta/berkas",
          },
          {
            title: "Verifikasi Pembayaran",
            href: "/dashboard/mrc/peserta/pembayaran",
          },
        ],
      },
      {
        title: "Operasional Hari-H",
        icon: Ticket,
        subItems: [
          {
            title: "Pendaftaran Ulang",
            href: "/dashboard/mrc/operasional/checkin",
          },
          {
            title: "Generate & Cetak QR",
            href: "/dashboard/mrc/operasional/qr",
          },
          {
            title: "Scan QR Anti-Joki",
            href: "/dashboard/mrc/operasional/scan",
          },
        ],
      },
      {
        title: "Manajemen Pertandingan",
        icon: Trophy,
        subItems: [
          {
            title: "Drawing Grup",
            href: "/dashboard/mrc/pertandingan/drawing",
          },
          {
            title: "Klasemen & Bracket",
            href: "/dashboard/mrc/pertandingan/bracket",
          },
          {
            title: "Panel Operator",
            href: "/dashboard/mrc/pertandingan/operator",
          },
        ],
      },
      {
        title: "Streaming & Overlay",
        icon: Video,
        subItems: [
          {
            title: "Pengaturan Overlay",
            href: "/dashboard/mrc/streaming/overlay",
          },
          { title: "Daftar Overlay", href: "/dashboard/mrc/streaming/daftar" },
        ],
      },
    ],
  },

  // ── 6. Super Admin Panel ──
  {
    label: "Super Admin",
    allowedRoles: ["super_admin"],
    items: [
      {
        title: "Super Admin Panel",
        icon: Crown,
        href: "/dashboard/admin",
      },
      {
        title: "Manajemen Akun & Role",
        icon: Users,
        href: "/dashboard/admin/roles",
      },
      {
        title: "Audit Logs Sistem",
        icon: FileText,
        href: "/dashboard/admin/audit",
      },
    ],
  },
];

// ═════════════════════════════════════════════════════
// UTILITY: Filter menu berdasarkan role user
// ═════════════════════════════════════════════════════

/** Status registrasi caang yang dianggap sudah "diterima" (lolos berkas ke atas) */
const ACCEPTED_CAANG_STATUSES = [
  "accepted",
  "training",
  "interview_1",
  "project_phase",
  "interview_2",
  "graduated",
];

/**
 * Memfilter daftar menu sidebar berdasarkan role yang dimiliki user.
 * Untuk role caang, menu juga difilter berdasarkan status registrasi.
 *
 * @param userRoles   - Array nama role yang dimiliki user
 * @param caangStatus - Status registrasi caang (opsional, hanya relevan untuk role caang)
 * @returns Array SidebarMenuGroup yang boleh dilihat user
 *
 * @example
 * const visibleMenu = filterMenuByRoles(['caang'], 'accepted')
 * const visibleMenu = filterMenuByRoles(['admin', 'pengurus'])
 */
export function filterMenuByRoles(
  userRoles: string[],
  caangStatus?: string | null,
): SidebarMenuGroup[] {
  const isCaang = userRoles.includes("caang");
  const isAcceptedCaang =
    isCaang &&
    caangStatus != null &&
    ACCEPTED_CAANG_STATUSES.includes(caangStatus);

  return SIDEBAR_MENU.filter((group) =>
    group.allowedRoles.some((role) => userRoles.includes(role)),
  ).map((group) => {
    // Untuk non-caang group, tampilkan semua item apa adanya
    if (!isCaang || !group.allowedRoles.includes("caang" as SystemRole)) {
      return group;
    }

    // Untuk caang group, filter item berdasarkan status registrasi
    return {
      ...group,
      items: group.items.filter((item) => {
        // Item tanpa syarat → selalu tampil (Dashboard Caang)
        if (!item.requiresAcceptedCaang) return true;
        // Item yang butuh accepted → hanya jika caang sudah diterima
        return isAcceptedCaang;
      }),
    };
  });
}
