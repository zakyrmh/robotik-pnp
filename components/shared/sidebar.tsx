"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Pendaftaran",
    href: "/pendaftaran",
    icon: UserGroupIcon,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/50 bg-card/30 backdrop-blur-xl lg:flex">
      {/* Brand Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-auto w-8 items-center gap-3">
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik PNP"
              width={150}
              height={150}
            />
          </div>
          <span className="font-bold tracking-tight text-foreground">
            Robotik PNP
          </span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={20}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-indigo-500"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.title}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-border/50 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={Settings02Icon} size={20} />
          Pengaturan
        </Link>
      </div>
    </aside>
  );
}
