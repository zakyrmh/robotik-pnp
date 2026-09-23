"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// SidebarProvider — satu sumber kebenaran untuk status sidebar:
// - `collapsed`   → mode desktop/tablet: rail ikon vs panel penuh
// - `mobileOpen`  → mode mobile: buka/tutup Sheet drawer
//
// Disimpan di Context (bukan CustomEvent) agar Header, Sidebar, dan
// SidebarInset (pembungkus konten) tetap sinkron tanpa saling mengenal.
// Preferensi minimize disimpan di localStorage; default awal berbeda
// untuk lebar tablet (768–1023px) agar sesuai DESIGN.md §12 — sidebar
// SIM "muncul sebagian" di tablet, penuh mulai breakpoint desktop (lg).
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "sidebar:collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Membaca preferensi `collapsed` awal.
 *
 * - Di server (tanpa `window`) selalu mengembalikan `false`, sama seperti
 *   render pertama klien, sehingga tidak terjadi hydration mismatch.
 * - Preferensi tersimpan di localStorage diutamakan; bila belum ada,
 *   ditebak dari lebar layar (rentang tablet md–lg dimulai minimized
 *   sesuai DESIGN.md §12 — sidebar SIM "muncul sebagian" di tablet).
 */
function readInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";
  } catch {
    // localStorage tidak tersedia (mis. mode privat) — lanjut ke fallback.
  }
  return window.matchMedia("(min-width: 768px) and (max-width: 1023px)")
    .matches;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer: preferensi dibaca sekali saat mount, bukan lewat
  // setState di dalam useEffect (yang memicu peringatan
  // `react-hooks/set-state-in-effect` pada React 19).
  const [collapsed, setCollapsedState] = useState(readInitialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Abaikan kegagalan penyimpanan preferensi.
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, setCollapsed, toggleCollapsed, mobileOpen],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar harus dipakai di dalam <SidebarProvider>");
  }
  return ctx;
}

// Lebar rail (minimized) & panel (expanded), didokumentasikan di sini agar
// jadi satu sumber rujukan. Tailwind v4 memindai class secara statis, jadi
// nilai ini TIDAK bisa disuntikkan secara dinamis ke `w-[...]`/`pl-[...]` —
// setiap tempat yang memakai lebar ini (sidebar.tsx & SidebarInset di bawah)
// tetap menuliskan class literal `4.5rem` / `w-64`, cukup jaga agar nilainya
// selalu sinkron dengan konstanta berikut bila diubah.
export const SIDEBAR_WIDTH_COLLAPSED = "4.5rem"; // 72px — cukup untuk target sentuh 44px + padding
export const SIDEBAR_WIDTH_EXPANDED = "16rem"; // 256px, setara w-64

// SidebarInset — pembungkus konten utama (Header + main). Client component
// karena perlu membaca status `collapsed` untuk menghitung padding-left
// yang match dengan lebar <aside>. layout.tsx sendiri tetap Server Component.
export function SidebarInset({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-[padding-left] duration-200 ease-in-out motion-reduce:transition-none",
        collapsed ? "md:pl-[4.5rem]" : "md:pl-64",
      )}
    >
      {children}
    </div>
  );
}
