"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSystemRoles } from "@/schemas/users";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { useSidebarContext } from "@/components/sidebar-context";

// =========================================================
// TYPES
// =========================================================

interface SidebarProps {
  userRoles: UserSystemRoles;
}

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  requiredRoles?: (keyof UserSystemRoles)[];
  checkVerified?: boolean;
};

type MenuGroup = {
  groupLabel: string;
  items: MenuItem[];
};

// =========================================================
// MENU CONFIGURATION
// =========================================================

const MENU_GROUPS: MenuGroup[] = [
  {
    groupLabel: "General",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    groupLabel: "Pendidikan & Seleksi",
    items: [
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
        href: "/attendance-management/recruitment",
        label: "Presensi Caang",
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
      // Student Access
      {
        href: "/learning",
        label: "Materi & Tugas",
        icon: GraduationCap,
        requiredRoles: ["isCaang"],
        checkVerified: true,
      },
      {
        href: "/presence",
        label: "Presensi Saya",
        icon: UserCheck,
        requiredRoles: ["isCaang"],
        checkVerified: true,
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
        href: "/activity-management/members",
        label: "Monitoring Kegiatan",
        icon: CalendarDays,
        requiredRoles: ["isKomdis", "isSuperAdmin"],
      },
      {
        href: "/attendance-management/members",
        label: "Presensi Anggota",
        icon: UserCheck,
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

// =========================================================
// SIDEBAR INNER COMPONENT (Extracted to prevent re-render)
// =========================================================

interface SidebarInnerProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile: boolean;
  closeSidebar: () => void;
  userRoles: UserSystemRoles;
  isCaangVerified: boolean;
}

function SidebarInner({
  isCollapsed,
  toggleCollapse,
  isMobile,
  closeSidebar,
  userRoles,
  isCaangVerified,
}: SidebarInnerProps) {
  const pathname = usePathname();

  // Permission Logic
  const hasPermission = (item: MenuItem) => {
    if (item.checkVerified && !isCaangVerified) return false;
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return item.requiredRoles.some((role) => userRoles[role] === true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Header / Logo */}
      <div
        className={cn(
          "h-[72px] flex items-center border-b border-slate-200 transition-all duration-300 relative",
          isCollapsed ? "justify-center px-0" : "justify-between px-4"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 overflow-hidden transition-all duration-300",
            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          )}
        >
          <div className="relative w-8 h-8 shrink-0">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight whitespace-nowrap">
            Robotik PNP
          </span>
        </div>

        {/* Toggle Button - VISIBLE IN BOTH STATES (Desktop Only) */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className={cn(
              "p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors z-20",
              isCollapsed ? "mx-auto" : ""
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {MENU_GROUPS.map((group, groupIndex) => {
          const visibleItems = group.items.filter(hasPermission);
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIndex} className="space-y-1">
              {/* Group Label */}
              {!isCollapsed && group.groupLabel && (
                <div className="px-3 mb-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {group.groupLabel}
                  </span>
                </div>
              )}
              {isCollapsed && group.groupLabel && (
                <div className="w-8 h-0.5 bg-slate-200 rounded-full my-3 mx-auto" />
              )}

              {/* Items */}
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={isMobile ? closeSidebar : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "shrink-0 transition-all duration-200",
                        isCollapsed ? "w-6 h-6" : "w-5 h-5",
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600"
                      )}
                    />

                    {!isCollapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && !isMobile && (
                      <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
                        {item.label}
                        <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// =========================================================
// MAIN SIDEBAR COMPONENT
// =========================================================

export function Sidebar({ userRoles }: SidebarProps) {
  const { isOpen, isMobile, closeSidebar } = useSidebarContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCaangVerified, setIsCaangVerified] = useState(false);

  // Verification Logic
  useEffect(() => {
    if (userRoles.isCaang) {
      const checkVerification = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
          const regRef = doc(db, "registrations", user.uid);
          const regSnap = await getDoc(regRef);
          if (regSnap.exists()) {
            const data = regSnap.data();
            const verified =
              data.status === "verified" &&
              data.verification?.verified === true;
            setIsCaangVerified(verified);
          }
        } catch (error) {
          console.error("Error checking verification:", error);
        }
      };
      checkVerification();
    }
  }, [userRoles.isCaang]);

  const sidebarVariants = {
    expanded: { width: "16rem" },
    collapsed: { width: "4.5rem" },
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* MOBILE: Drawer Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-white shadow-2xl lg:hidden"
            >
              <SidebarInner
                isCollapsed={false}
                toggleCollapse={toggleCollapse}
                isMobile={true}
                closeSidebar={closeSidebar}
                userRoles={userRoles}
                isCaangVerified={isCaangVerified}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP: Static / Collapsible */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 z-30 shrink-0 shadow-sm border-r bg-slate-50"
        )}
      >
        <SidebarInner
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          isMobile={false}
          closeSidebar={closeSidebar}
          userRoles={userRoles}
          isCaangVerified={isCaangVerified}
        />
      </motion.aside>
    </>
  );
}
