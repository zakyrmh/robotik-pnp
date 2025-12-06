"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  ShieldAlert,
  FileWarning,
  Settings,
  GraduationCap,
  UserCheck,
  CalendarClock,
  FileCheck,
  UsersRound,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserSystemRoles } from "@/types/users";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  userRoles: UserSystemRoles; // Menggunakan tipe data baru
}

// =========================================================
// KONFIGURASI MENU
// =========================================================

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  // Jika requiredRoles kosong, berarti menu ini untuk SEMUA user
  // Jika diisi, user harus punya minimal SATU dari role tersebut
  requiredRoles?: (keyof UserSystemRoles)[];
};

type MenuGroup = {
  groupLabel: string;
  items: MenuItem[];
};

export function Sidebar({
  isOpen,
  isMobile,
  onClose,
  userRoles,
}: SidebarProps) {
  const pathname = usePathname();

  // Definisi Menu berdasarkan Struktur Organisasi
  const MENU_GROUPS: MenuGroup[] = [
    {
      groupLabel: "General",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/timeline", label: "Timeline", icon: CalendarCheck },
      ],
    },
    {
      groupLabel: "Pendidikan & Seleksi",
      items: [
        // Khusus Recruiter
        {
          href: "/caang-management",
          label: "Data Caang",
          icon: Users,
          requiredRoles: ["isRecruiter", "isSuperAdmin"],
        },
        {
          href: "/activity-management/recruitment",
          label: "Jadwal Aktivitas",
          icon: CalendarClock,
          requiredRoles: ["isRecruiter", "isSuperAdmin"],
        },
        {
          href: "/attendance-management",
          label: "Presensi Peserta",
          icon: UserCheck,
          requiredRoles: ["isRecruiter", "isSuperAdmin"],
        },
        {
          href: "/material-management",
          label: "Manajemen Materi",
          icon: BookOpen,
          requiredRoles: ["isRecruiter", "isSuperAdmin"],
        },
        {
          href: "/task-grade-management",
          label: "Tugas dan Penilaian",
          icon: FileCheck,
          requiredRoles: ["isRecruiter", "isSuperAdmin"],
        },
        {
          href: "/group-management",
          label: "Pembagian Kelompok",
          icon: UsersRound,
          requiredRoles: ["isRecruiter", "isSuperAdmin"],
        },

        // Khusus Caang (Peserta)
        {
          href: "/learning",
          label: "Materi & Tugas",
          icon: GraduationCap,
          requiredRoles: ["isCaang"],
        },
        {
          href: "/presence",
          label: "Presensi Saya",
          icon: UserCheck,
          requiredRoles: ["isCaang"],
        },
      ],
    },
    {
      groupLabel: "Kesekretariatan",
      items: [
        {
          href: "/picket-schedule",
          label: "Jadwal Piket",
          icon: ClipboardList,
          requiredRoles: [
            "isOfficialMember",
            "isKestari",
            "isSuperAdmin",
            "isKRIMember",
          ],
        },
        {
          href: "/picket-management",
          label: "Kelola Piket",
          icon: Settings,
          requiredRoles: ["isKestari", "isSuperAdmin"],
        },
      ],
    },
    {
      groupLabel: "Komisi Disiplin",
      items: [
        {
          href: "/activity-management",
          label: "Monitoring Kegiatan/members",
          icon: CalendarDays,
          requiredRoles: ["isKomdis", "isSuperAdmin"],
        },
        {
          href: "/violations",
          label: "Input Pelanggaran",
          icon: ShieldAlert,
          requiredRoles: ["isKomdis", "isSuperAdmin"],
        },
        {
          href: "/sanctions-data",
          label: "Data Sanksi",
          icon: FileWarning,
          requiredRoles: ["isKomdis", "isSuperAdmin"],
        },
      ],
    },
    {
      groupLabel: "Sistem",
      items: [
        {
          href: "/user-management",
          label: "Manajemen User",
          icon: Users,
          requiredRoles: ["isSuperAdmin"],
        },
      ],
    },
  ];

  // Fungsi helper untuk mengecek apakah user berhak melihat item ini
  const hasPermission = (requiredRoles?: (keyof UserSystemRoles)[]) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    // Cek apakah user memiliki salah satu dari role yang dibutuhkan
    return requiredRoles.some((role) => userRoles[role] === true);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: isMobile ? "-100%" : 0, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isMobile ? "-100%" : 0, opacity: 0 }}
          transition={{ type: "tween", duration: 0.3 }}
          className={cn(
            "z-40 flex h-full w-64 flex-col border-r bg-card shadow-md",
            isMobile && "fixed left-0 top-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b h-[84px]">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="Logo" width={32} height={32} />
              <span className="text-lg font-semibold">Robotik PNP</span>
            </Link>
            {isMobile && (
              <button className="p-2 rounded hover:bg-accent" onClick={onClose}>
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {MENU_GROUPS.map((group, groupIndex) => {
              // Filter item yang boleh dilihat user ini
              const visibleItems = group.items.filter((item) =>
                hasPermission(item.requiredRoles)
              );

              // Jika tidak ada item yang visible di grup ini, jangan render grupnya
              if (visibleItems.length === 0) return null;

              return (
                <div key={groupIndex} className="space-y-2">
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.groupLabel}
                  </h3>
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={isMobile ? onClose : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/80"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
