// app/(private)/layout.tsx
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/shared/sidebar-provider";
import { getPendingChangeRequestMapAction } from "@/lib/actions/event-admin";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Badge "Data Pendaftar": jumlah permohonan perbaikan data yang menunggu
  // tinjauan panitia. Gagal-diam (0) untuk role non-panitia.
  const pendingRes = await getPendingChangeRequestMapAction();
  const pendingChangeCount = pendingRes.success ? pendingRes.data.count : 0;
  const badgeCounts =
    pendingChangeCount > 0 ? { mrcPendaftaran: pendingChangeCount } : {};

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar badgeCounts={badgeCounts} />
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
