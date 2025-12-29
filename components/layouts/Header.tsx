"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "@/components/sidebar-context";
import { Menu, ChevronRight, Home } from "lucide-react";
import { UserInfo } from "@/components/layouts/user-info";
import { Fragment } from "react";

export function Header() {
  const { toggleSidebar } = useSidebarContext();
  const pathname = usePathname();

  // Helper to generate breadcrumbs
  const generateBreadcrumbs = () => {
    // Remove query params and split
    const asPathWithoutQuery = pathname.split("?")[0];
    const asPathNestedRoutes = asPathWithoutQuery
      .split("/")
      .filter((v) => v.length > 0);

    // Map path segments to readable names
    const getReadableName = (segment: string) => {
      // Custom mappings
      const mappings: Record<string, string> = {
        dashboard: "Dashboard",
        "caang-management": "Data Caang",
        "activity-management": "Aktivitas",
        "attendance-management": "Presensi",
        "material-management": "Materi",
        "task-grade-management": "Penilaian",
        "group-management": "Kelompok",
        "picket-schedule": "Jadwal Piket",
        "picket-management": "Kelola Piket",
        "user-management": "Manajemen User",
        learning: "Pembelajaran",
        presence: "Presensi Saya",
        recruitment: "Recruitment",
        members: "Anggota",
      };

      return (
        mappings[segment] ||
        segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      );
    };

    return asPathNestedRoutes.map((segment, index) => {
      const href = "/" + asPathNestedRoutes.slice(0, index + 1).join("/");
      return {
        href,
        label: getReadableName(segment),
        isLast: index === asPathNestedRoutes.length - 1,
      };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-6 backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger */}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 max-sm:hidden">
          <Link
            href="/dashboard"
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>

          {breadcrumbs.length > 0 && (
            <ChevronRight className="w-4 h-4 mx-2 text-slate-300 dark:text-slate-700" />
          )}

          {breadcrumbs.map((crumb) => (
            <Fragment key={crumb.href}>
              {crumb.isLast ? (
                <span className="text-slate-900 dark:text-slate-100 font-semibold cursor-default">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-blue-600 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
              {!crumb.isLast && (
                <ChevronRight className="w-4 h-4 mx-2 text-slate-300 dark:text-slate-700" />
              )}
            </Fragment>
          ))}
        </nav>

        {/* Mobile Title Replacement (Simple) */}
        <div className="lg:hidden sm:hidden font-semibold text-slate-800 dark:text-slate-100">
          {breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1].label
            : "Robotik PNP"}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* You can add Notification bells or theme toggles here */}
        <UserInfo />
      </div>
    </header>
  );
}
