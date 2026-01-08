"use client";

import { ReactNode } from "react";

/**
 * @deprecated This component is deprecated.
 * The unified layout at `app/(private)/layout.tsx` now handles:
 * - DashboardProvider (context)
 * - SidebarProvider
 * - Sidebar & Header components
 * - PageLoader (loading state)
 *
 * This file is kept only for backward compatibility.
 * Use the (private) layout directly instead.
 */

interface DashboardClientWrapperProps {
  children: ReactNode;
}

export function DashboardClientWrapper({
  children,
}: DashboardClientWrapperProps) {
  // Simply pass through children since the parent layout handles everything
  return <>{children}</>;
}
