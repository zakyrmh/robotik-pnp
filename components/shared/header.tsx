"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Search01Icon,
  Menu01Icon,
  Sun01Icon,
  Moon01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Custom SVG Icon for Logout
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

export function Header() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#avatar-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [isDropdownOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 lg:px-8 shadow-sm">
      {/* Mobile Menu Toggle */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mr-2 lg:hidden"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
          className="rounded-none border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 transition-colors"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} />
        </Button>
      </motion.div>

      {/* Quick Search */}
      <div className="relative hidden w-full max-w-sm lg:flex">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
        />
        <Input
          placeholder="CARI SESUATU..."
          className="h-9 w-full bg-zinc-50/50 dark:bg-zinc-900/30 pl-10 focus:bg-background transition-all rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 focus-visible:border-zinc-300 dark:focus-visible:border-zinc-700"
        />
      </div>

      {/* Right Side Controls */}
      <div className="ml-auto flex items-center gap-2 lg:gap-4">
        {/* Tombol Ganti Tema */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
            aria-label="Toggle Theme"
          >
            {mounted ? (
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <HugeiconsIcon icon={theme === "light" ? Moon01Icon : Sun01Icon} size={20} />
              </motion.div>
            ) : (
              <div className="h-5 w-5" />
            )}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          {/* Tombol Notifikasi */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            <HugeiconsIcon icon={Notification01Icon} size={20} />
            <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[9px] font-mono font-bold bg-[#e22718] text-white border border-[#e22718] rounded-none shadow-[0_0_8px_rgba(226,39,24,0.4)]">
              2
            </Badge>
          </Button>
        </motion.div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden lg:block" />

        {/* User Profile Info */}
        <div id="avatar-dropdown-container" className="relative flex items-center gap-3 pl-2">
          <div className="hidden flex-col items-end lg:flex select-none">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
              {user?.name || "GUEST USER"}
            </span>
            <span className="mt-0.5 text-[9px] font-bold font-mono tracking-widest text-[#1c69d4] dark:text-[#0066b1] uppercase">
              {user?.role || "USER"}
            </span>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="h-9 w-9 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-[1.5px] cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative"
          >
            <div className="flex h-full w-full items-center justify-center rounded-none bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-xs font-mono font-bold text-zinc-900 dark:text-zinc-50">
              {user?.photo_url ? (
                <Image
                  src={user.photo_url}
                  alt={user.name || "User Avatar"}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : "G"
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg z-50 overflow-hidden"
              >
                {/* User info for mobile screen inside dropdown */}
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-900 lg:hidden block">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase truncate">
                    {user?.name || "GUEST USER"}
                  </p>
                  <p className="text-[8px] font-mono font-bold tracking-wider text-[#1c69d4] dark:text-[#0066b1] uppercase mt-0.5">
                    {user?.role || "USER"}
                  </p>
                </div>
                
                <button
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    await logout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-[#e22718] dark:hover:text-[#e22718] transition-colors rounded-none text-left cursor-pointer border-none"
                >
                  <LogoutIcon />
                  LOGOUT
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tricolor Tech Stripe bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
    </header>
  );
}
