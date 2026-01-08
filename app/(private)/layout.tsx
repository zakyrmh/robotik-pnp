"use client";

import { ReactNode } from "react";
import {
  DashboardProvider,
  useDashboard,
} from "@/components/dashboard/dashboard-context";
import { PageLoader } from "@/components/ui/page-loader";
import { SidebarProvider } from "@/components/sidebar-context";
import { Sidebar } from "@/components/layouts/Sidebar";
import { Header } from "@/components/layouts/Header";

// =========================================================
// INNER LAYOUT CONTENT (uses context)
// =========================================================

interface PrivateLayoutContentProps {
  children: ReactNode;
}

function PrivateLayoutContent({ children }: PrivateLayoutContentProps) {
  const { isLoading } = useDashboard();

  // Show loader while any data is loading
  if (isLoading) {
    return <PageLoader message="Memuat data..." />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
        {/* SIDEBAR: Static on Desktop, Drawer on Mobile */}
        <Sidebar />

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex flex-1 flex-col h-full overflow-hidden relative">
          {/* HEADER (Sticky) */}
          <Header />

          {/* SCROLLABLE MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-3 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// =========================================================
// PRIVATE LAYOUT (wraps context provider)
// =========================================================

interface PrivateLayoutProps {
  children: ReactNode;
}

export default function PrivateLayout({ children }: PrivateLayoutProps) {
  return (
    <DashboardProvider>
      <PrivateLayoutContent>{children}</PrivateLayoutContent>
    </DashboardProvider>
  );
}
