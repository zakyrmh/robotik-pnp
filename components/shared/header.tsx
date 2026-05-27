"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Search01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { motion } from "framer-motion";

export function Header() {
  const { user } = useAuth();

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
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden flex-col items-end lg:flex">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
              {user?.name || "GUEST USER"}
            </span>
            <span className="mt-0.5 text-[9px] font-bold font-mono tracking-widest text-[#1c69d4] dark:text-[#0066b1] uppercase">
              {user?.role || "USER"}
            </span>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
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
        </div>
      </div>

      {/* Tricolor Tech Stripe bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
    </header>
  );
}
