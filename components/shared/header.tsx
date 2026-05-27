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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-border/40 bg-background/70 backdrop-blur-xl px-4 lg:px-8 relative shadow-sm">
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
          className="rounded-none border border-border/60 hover:bg-[#0066b1]/10 hover:text-[#0066b1] transition-colors"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} />
        </Button>
      </motion.div>

      {/* Quick Search */}
      <div className="relative hidden w-full max-w-sm lg:flex">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="CARI SESUATU..."
          className="h-9 w-full bg-muted/20 pl-10 focus:bg-background/50 transition-all rounded-none border border-border/60 font-mono text-xs uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-[#0066b1] focus-visible:border-[#0066b1]"
        />
      </div>

      {/* Right Side Controls */}
      <div className="ml-auto flex items-center gap-2 lg:gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-none border border-border/60 text-muted-foreground hover:text-foreground hover:bg-[#0066b1]/10 hover:border-[#0066b1]/40 transition-all"
          >
            <HugeiconsIcon icon={Notification01Icon} size={20} />
            <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[9px] font-mono font-bold bg-[#e22718] text-white border border-[#e22718] rounded-none shadow-[0_0_8px_rgba(226,39,24,0.4)]">
              2
            </Badge>
          </Button>
        </motion.div>

        <div className="h-8 w-px bg-border/40 mx-1 hidden lg:block" />

        {/* User Profile Info */}
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden flex-col items-end lg:flex">
            <span className="text-sm font-bold tracking-tight text-foreground uppercase">
              {user?.name || "GUEST USER"}
            </span>
            <span className="mt-0.5 text-[9px] font-bold font-mono tracking-widest text-[#1c69d4] uppercase">
              {user?.role || "USER"}
            </span>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="h-9 w-9 rounded-none border border-border bg-card p-[1.5px] cursor-pointer hover:border-[#0066b1] transition-colors relative"
          >
            <div className="flex h-full w-full items-center justify-center rounded-none bg-muted overflow-hidden text-xs font-mono font-bold text-foreground">
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
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
    </header>
  );
}
