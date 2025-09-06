"use client";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, useSidebarContext } from "@/components/sidebar-context";

function SidebarConsumer() {
  const { isOpen, isMobile, closeSidebar } = useSidebarContext();
  return <Sidebar isOpen={isOpen} isMobile={isMobile} onClose={closeSidebar} />;
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <SidebarConsumer />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 w-screen lg:w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
