"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Logout01Icon,
  UserCheck01Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";
import { signOut } from "@/lib/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ProfileWidgetProps {
  user: {
    id: string;
    email?: string | null;
    name: string;
    role: string;
    photo_url?: string;
    nim?: string;
  } | null;
}

export function ProfileWidget({ user }: ProfileWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl border border-border dark:border-white/10 bg-card p-1.5 pr-3.5 text-left shadow-xs transition-all hover:bg-muted/50 active:scale-98 cursor-pointer select-none"
      >
        <div className="h-8 w-8 rounded-lg bg-dongker-surface p-[1px] overflow-hidden flex items-center justify-center">
          <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-card overflow-hidden text-xs font-bold text-foreground">
            {user.photo_url ? (
              <Image
                src={user.photo_url}
                alt={user.name}
                width={32}
                height={32}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <div className="hidden flex-col md:flex">
          <span className="text-xs font-semibold leading-tight text-foreground line-clamp-1">
            {user.name}
          </span>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-pnp-orange">
            {user.role}
          </span>
        </div>
        <HugeiconsIcon
          icon={ArrowRight02Icon}
          size={14}
          className={`text-muted-foreground transition-transform duration-200 hidden md:block ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Click Away Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 z-50 w-72 origin-top-right rounded-xl border border-border dark:border-white/10 bg-card p-4 shadow-xl backdrop-blur-md"
          >
            {/* User Info Card inside Dropdown */}
            <div className="flex flex-col items-center border-b border-border pb-4 text-center">
              <div className="relative mb-3 h-14 w-14 rounded-xl bg-dongker-surface p-[1px] overflow-hidden">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-card overflow-hidden text-base font-bold text-foreground">
                  {user.photo_url ? (
                    <Image
                      src={user.photo_url}
                      alt={user.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <h3 className="font-bold text-sm text-foreground line-clamp-1">{user.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2 font-sans">
                {user.email || "-"}
              </p>
              <Badge variant="outline" className="gap-1 px-2.5 py-0.5 text-micro font-mono font-semibold uppercase bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border-pnp-orange/30">
                <HugeiconsIcon icon={UserCheck01Icon} size={12} />
                {user.role}
              </Badge>
            </div>

            {/* Logout Action */}
            <div className="pt-3">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-destructive transition-all hover:bg-destructive/10 active:scale-98 cursor-pointer"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} className="text-destructive shrink-0" />
                  <span>Keluar / Sign Out</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
