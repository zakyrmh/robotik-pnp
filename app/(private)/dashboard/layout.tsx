import { ReactNode } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

interface DashboardLayoutProps {
  children: ReactNode;
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
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardContent>{children}</DashboardContent>;
}
