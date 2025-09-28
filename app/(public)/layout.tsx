"use client";

import Navbar from "@/components/Navbar";
import ThemeToggle from "@/components/ThemeToggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="pt-16">
      <Navbar />
      {children}
      <ThemeToggle />
    </main>
  );
}
