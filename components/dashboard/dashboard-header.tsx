/**
 * DashboardHeader — Header responsif untuk area konten dashboard
 *
 * Menampilkan:
 * - Tombol toggle sidebar (SidebarTrigger) untuk mobile dan desktop
 * - Breadcrumb navigasi (opsional, bisa dikembangkan nanti)
 * - Separator visual antara trigger dan konten header
 *
 * Komponen ini ditempatkan di dalam SidebarInset sebagai header utama.
 */

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface DashboardHeaderProps {
  /** Judul halaman yang sedang aktif */
  title?: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {/* Tombol toggle sidebar */}
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="mr-2 h-4!" />

      {/* Judul halaman */}
      {title && (
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
      )}
    </header>
  )
}
