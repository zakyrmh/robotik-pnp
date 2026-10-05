"use client";

import type {
  PiketComplianceRow,
  PiketHistoryLog,
} from "@/lib/repositories/piket";
import type { PiketProfile } from "./types";

/**
 * Props kontrak `PiketHistoryClient` (lihat plan Task 6). Di-definisikan di
 * sini agar RSC `/piket/riwayat` dapat di-typecheck; Task 6 mengisi
 * implementasi penuh (filter bar + tab Kepatuhan/Log + drawer anggota).
 */
export interface PiketHistoryClientProps {
  profile: PiketProfile;
  availablePeriods: string[];
  logs: PiketHistoryLog[];
  compliance: PiketComplianceRow[];
  initialTab: "kepatuhan" | "log";
  activeFilter: {
    academicPeriod: string;
    year: number | null;
    monthIndex0: number | null;
    weekNumber: number | null;
  };
}

/**
 * Placeholder Task 5 — implementasi penuh dibangun pada Task 6/7.
 * Halaman RSC tetap dapat resolve import & lolos typecheck.
 */
export function PiketHistoryClient(props: PiketHistoryClientProps) {
  void props;
  return null;
}
