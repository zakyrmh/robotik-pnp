"use client";

import { useEffect, useState } from "react";
import { PageLoader } from "./page-loader";

export function InitialLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sembunyikan loader setelah assets selesai dimuat
    // minimum 800ms agar animasi sempat terlihat
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;
  return <>{children}</>;
}
