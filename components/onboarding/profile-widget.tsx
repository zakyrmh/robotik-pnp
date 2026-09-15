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
        className="flex items-center gap-2.5 rounded-full border border-border bg-card p-1 pr-3 text-left shadow-2xs transition-all hover:bg-muted/50 active:scale-98 cursor-pointer select-none"
      >
        <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border shrink-0">
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
            <span className="text-xs font-bold text-foreground uppercase">
              {user.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="hidden flex-col md:flex">
          <span className="text-xs font-semibold leading-tight text-foreground line-clamp-1">
            {user.name}
          </span>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
            {user.role}
          </span>
        </div>
        <HugeiconsIcon
          icon={ArrowRight02Icon}
          size={13}
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
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 z-50 w-68 origin-top-right rounded-2xl border border-border bg-card p-4 shadow-xl backdrop-blur-md"
          >
            {/* User Info Card inside Dropdown */}
            <div className="flex flex-col items-center border-b border-border pb-3.5 text-center">
              <div className="relative mb-2.5 h-13 w-13 rounded-full bg-secondary p-0.5 overflow-hidden border border-border">
                {user.photo_url ? (
                  <Image
                    src={user.photo_url}
                    alt={user.name}
                    width={52}
                    height={52}
                    className="h-full w-full object-cover rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm text-foreground line-clamp-1">
                {user.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2 font-mono">
                {user.email || "-"}
              </p>
              <Badge
                variant="outline"
                className="gap-1 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-primary-soft text-primary border-primary/20"
              >
                <HugeiconsIcon icon={UserCheck01Icon} size={12} />
                {user.role}
              </Badge>
            </div>

            {/* Logout Action */}
            <div className="pt-2.5">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-destructive transition-all hover:bg-destructive/10 active:scale-98 cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={Logout01Icon}
                    size={16}
                    className="text-destructive shrink-0"
                  />
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
