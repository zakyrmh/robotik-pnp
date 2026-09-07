import React from "react";
import { UserRole } from "@/lib/types/user-management";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SecurityCheckIcon,
  Award01Icon,
  AlertCircleIcon,
  UserCheck01Icon,
  Wrench01Icon,
  UserIcon,
  Mortarboard02Icon,
} from "@hugeicons/core-free-icons";

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: typeof SecurityCheckIcon;
  }
> = {
  "super-admin": {
    label: "Super Admin",
    bgClass: "bg-red-500/10 dark:bg-red-500/15",
    textClass: "text-red-700 dark:text-red-400 font-semibold",
    borderClass: "border-red-500/20 dark:border-red-500/30",
    icon: SecurityCheckIcon,
  },
  "admin-or": {
    label: "Admin OR",
    bgClass: "bg-purple-500/10 dark:bg-purple-500/15",
    textClass: "text-purple-700 dark:text-purple-400 font-semibold",
    borderClass: "border-purple-500/20 dark:border-purple-500/30",
    icon: Award01Icon,
  },
  "admin-komdis": {
    label: "Admin Komdis",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/15",
    textClass: "text-amber-700 dark:text-amber-400 font-semibold",
    borderClass: "border-amber-500/20 dark:border-amber-500/30",
    icon: AlertCircleIcon,
  },
  "admin-kestari": {
    label: "Admin Kestari",
    bgClass: "bg-sky-500/10 dark:bg-sky-500/15",
    textClass: "text-sky-700 dark:text-sky-400 font-semibold",
    borderClass: "border-sky-500/20 dark:border-sky-500/30",
    icon: UserCheck01Icon,
  },
  "admin-divisi": {
    label: "Admin Divisi",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/15",
    textClass: "text-emerald-700 dark:text-emerald-400 font-semibold",
    borderClass: "border-emerald-500/20 dark:border-emerald-500/30",
    icon: Wrench01Icon,
  },
  anggota: {
    label: "Anggota Aktif",
    bgClass: "bg-primary-soft text-primary",
    textClass: "text-primary font-medium",
    borderClass: "border-primary/20",
    icon: UserCheck01Icon,
  },
  caang: {
    label: "Calon Anggota",
    bgClass: "bg-accent text-accent-foreground",
    textClass: "text-accent-foreground font-medium",
    borderClass: "border-accent-strong/20",
    icon: UserIcon,
  },
  alumni: {
    label: "Alumni",
    bgClass: "bg-muted text-muted-foreground",
    textClass: "text-muted-foreground font-medium",
    borderClass: "border-border",
    icon: Mortarboard02Icon,
  },
};

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const config = ROLE_CONFIG[role] || {
    label: role,
    bgClass: "bg-muted text-muted-foreground",
    textClass: "text-muted-foreground font-medium",
    borderClass: "border-border",
    icon: UserIcon,
  };

  const iconName = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border shadow-2xs whitespace-nowrap",
        config.bgClass,
        config.textClass,
        config.borderClass,
        className,
      )}
    >
      <HugeiconsIcon icon={iconName} size={13} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
