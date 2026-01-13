import { ReactNode } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

interface DashboardLayoutProps {
  children: ReactNode;
  overview: ReactNode;
  kri: ReactNode;
  official: ReactNode;
  komdis: ReactNode;
  recruitment: ReactNode;
  management: ReactNode;
}

/**
 * Dashboard Layout
 *
 * This layout wraps the dashboard-specific content.
 * The parent (private) layout already handles:
 * - DashboardProvider (context)
 * - SidebarProvider
 * - Sidebar & Header components
 * - PageLoader (loading state)
 *
 * So we only need to wrap with DashboardContent for dashboard-specific UI.
 */
export default function DashboardLayout({
  children,
  overview,
  kri,
  official,
  komdis,
  recruitment,
  management,
}: DashboardLayoutProps) {
  return (
    <DashboardContent
      overview={overview}
      kri={kri}
      official={official}
      komdis={komdis}
      recruitment={recruitment}
      management={management}
    >
      {children}
    </DashboardContent>
  );
}
