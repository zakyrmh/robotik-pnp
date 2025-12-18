"use client";

import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useOnlinePresence();

  // Pastikan hanya render setelah client mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Sembunyikan dulu konten biar nggak mismatch
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
