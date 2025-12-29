import { ReactNode } from "react";
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";

interface CaangManagementLayoutProps {
  children: ReactNode;
}

export default function CaangManagementLayout({
  children,
}: CaangManagementLayoutProps) {
  return <DashboardClientWrapper>{children}</DashboardClientWrapper>;
}
