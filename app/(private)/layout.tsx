// app/(private)/layout.tsx
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/shared/sidebar-provider";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Padding kiri konten mengikuti lebar sidebar (rail atau panel penuh)
            secara reaktif lewat SidebarInset — lihat sidebar-provider.tsx */}
        <SidebarInset>
          <Header />
          <main className="p-4 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
