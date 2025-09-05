"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "@/components/sidebar-context";
import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { UserInfo } from "@/components/user-info";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const pathname = usePathname();

  const title =
    pathname === "/"
      ? "Robotik PNP"
      : pathname === "/dashboard"
      ? "Dashboard"
      : pathname === "/pendaftaran"
      ? "Pendaftaran"
      : "";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-4 py-4 shadow-sm md:px-6 h-[84px]">
      {/* Hamburger (mobile only) */}
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-2 py-1 hover:bg-accent hover:text-accent-foreground lg:hidden"
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {/* Logo (mobile only) */}
      {isMobile && (
        <Link href="/" className="ml-2 max-[430px]:hidden">
          <Image
            src="/images/logo.png"
            width={45}
            height={45}
            alt="Logo Robotik PNP"
          />
        </Link>
      )}

      {/* Page Title */}
      <div className="max-xl:hidden">
        <h1 className="mb-1 text-xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">We Play with Technology</p>
      </div>

      {/* Right actions */}
      <div className="flex flex-1 items-center justify-end gap-3">
        <ThemeToggle />
        <UserInfo />
      </div>
    </header>
  );
}
