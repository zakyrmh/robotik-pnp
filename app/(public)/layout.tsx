"use client";

import Navbar from "@/components/layouts/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="pt-16">
      <Navbar />
      {children}
    </main>
  );
}
