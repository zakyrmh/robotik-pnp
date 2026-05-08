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
      {/* 256px adalah lebar sidebar (w-64) */}
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
