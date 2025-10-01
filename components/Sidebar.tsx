"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  role: string;
}

const caangMenu = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pendaftaran", label: "Pendaftaran" },
];

const adminMenu = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/management-activity", label: "Aktivitas" },
  { href: "/attendance", label: "Presensi" },
];

export function Sidebar({ isOpen, isMobile, onClose, role }: SidebarProps) {
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
          {/* Sidebar Header */}
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

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-3">
            {role !== "admin"
              ? caangMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.label}
                  </Link>
                ))
              : adminMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
