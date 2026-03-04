/**
 * Layout Overlay — Layout khusus untuk halaman overlay OBS.
 *
 * Halaman overlay:
 * - Tidak memerlukan autentikasi (publik)
 * - Background transparan (untuk OBS Browser Source)
 * - Tidak ada sidebar, header, atau navigasi
 * - Optimasi resolusi 1920×1080
 */

import { Suspense } from 'react'

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-transparent">
      <Suspense fallback={<div className="fixed inset-0 bg-transparent" />}>
        {children}
      </Suspense>
    </div>
  )
}
