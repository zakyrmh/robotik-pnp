import React from "react";
import { UserRole } from "@/lib/types/user-management";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  Award,
  Wrench,
  User,
  GraduationCap,
} from "lucide-react";

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
    icon: React.ElementType;
  }
> = {
  "super-admin": {
    label: "Super Admin",
    bgClass: "bg-red-50 dark:bg-red-950/40",
    textClass: "text-red-700 dark:text-red-300 font-bold",
    borderClass: "border-red-200 dark:border-red-800",
    icon: ShieldCheck,
  },
  "admin-or": {
    label: "Admin OR",
    bgClass: "bg-purple-50 dark:bg-purple-950/40",
    textClass: "text-purple-700 dark:text-purple-300 font-semibold",
    borderClass: "border-purple-200 dark:border-purple-800",
    icon: Award,
  },
  "admin-komdis": {
    label: "Admin Komdis",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
    textClass: "text-amber-700 dark:text-amber-300 font-semibold",
    borderClass: "border-amber-200 dark:border-amber-800",
    icon: ShieldAlert,
  },
  "admin-kestari": {
    label: "Admin Kestari",
    bgClass: "bg-blue-50 dark:bg-blue-950/40",
    textClass: "text-blue-700 dark:text-blue-300 font-semibold",
    borderClass: "border-blue-200 dark:border-blue-800",
    icon: UserCheck,
  },
  "admin-divisi": {
    label: "Admin Divisi",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    textClass: "text-emerald-700 dark:text-emerald-300 font-semibold",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    icon: Wrench,
  },
  anggota: {
    label: "Anggota Aktif",
    bgClass: "bg-sky-50 dark:bg-sky-950/40",
    textClass: "text-sky-700 dark:text-sky-300",
    borderClass: "border-sky-200 dark:border-sky-800",
    icon: UserCheck,
  },
  caang: {
    label: "Calon Anggota",
    bgClass: "bg-slate-100 dark:bg-slate-800",
    textClass: "text-slate-700 dark:text-slate-300",
    borderClass: "border-slate-200 dark:border-slate-700",
    icon: User,
  },
  alumni: {
    label: "Alumni",
    bgClass: "bg-zinc-100 dark:bg-zinc-800",
    textClass: "text-zinc-600 dark:text-zinc-400",
    borderClass: "border-zinc-200 dark:border-zinc-700",
    icon: GraduationCap,
  },
};

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const config = ROLE_CONFIG[role] || {
    label: role,
    bgClass: "bg-neutral-100 dark:bg-neutral-800",
    textClass: "text-neutral-700 dark:text-neutral-300",
    borderClass: "border-neutral-200 dark:border-neutral-700",
    icon: User,
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium transition-all shadow-xs",
        config.bgClass,
        config.textClass,
        config.borderClass,
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
