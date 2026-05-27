// app/(private)/layout.tsx
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Dynamic sidebar width support */}
      <div className="lg:pl-[var(--sidebar-width,16rem)] transition-[padding] duration-300 ease-in-out">
        <Header />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
