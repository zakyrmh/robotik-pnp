"use client";

import { useEffect, useState } from "react";
import { PageLoader } from "./page-loader";

export function InitialLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memberikan jeda agar aset browser benar-benar siap
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader message="Mempersiapkan sistem..." />;
  return <>{children}</>;
}
