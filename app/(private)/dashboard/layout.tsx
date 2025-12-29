import { ReactNode } from "react";
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardClientWrapper>
      <DashboardContent>{children}</DashboardContent>
    </DashboardClientWrapper>
  );
}
