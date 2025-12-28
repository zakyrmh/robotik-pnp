"use client";

import { ThemeProvider } from "next-themes";
import dynamic from "next/dynamic";

import { useOnlinePresence } from "@/hooks/useOnlinePresence";

const ThemeToggle = dynamic(() => import("@/components/layouts/ThemeToggle"), {
  ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  useOnlinePresence();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
      <ThemeToggle />
    </ThemeProvider>
  );
}
