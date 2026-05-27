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
        className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 p-1.5 pr-4 text-left shadow-xs backdrop-blur-md transition-all hover:bg-card/75 active:scale-98 cursor-pointer select-none"
      >
        <div className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-[1.5px]">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card overflow-hidden text-xs font-bold">
            {user.photo_url ? (
              <Image
                src={user.photo_url}
                alt={user.name}
                width={36}
                height={36}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <div className="hidden flex-col md:flex">
          <span className="text-sm font-semibold leading-tight text-foreground">
            {user.name}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
            {user.role}
          </span>
        </div>
        <HugeiconsIcon
          icon={ArrowRight02Icon}
          size={16}
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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 z-50 w-72 origin-top-right rounded-2xl border border-border/50 bg-card/85 p-4 shadow-xl backdrop-blur-xl"
          >
            {/* User Info Card inside Dropdown */}
            <div className="flex flex-col items-center border-b border-border/40 pb-4 text-center">
              <div className="relative mb-3 h-16 w-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-card overflow-hidden text-lg font-bold">
                  {user.photo_url ? (
                    <Image
                      src={user.photo_url}
                      alt={user.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <h3 className="font-bold text-foreground line-clamp-1">{user.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {user.email || "-"}
              </p>
              <Badge variant="secondary" className="gap-1 px-2.5 py-0.5 text-xs font-semibold capitalize bg-indigo-500/10 text-indigo-500 border-none">
                <HugeiconsIcon icon={UserCheck01Icon} size={12} />
                {user.role}
              </Badge>
            </div>

            {/* Logout Action */}
            <div className="pt-3">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-all hover:bg-red-500/10 active:scale-98 cursor-pointer"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={18} className="text-red-500" />
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
