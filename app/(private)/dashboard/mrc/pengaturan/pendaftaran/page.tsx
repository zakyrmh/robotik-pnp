/**
 * Halaman Buka/Tutup Pendaftaran MRC — /dashboard/mrc/pengaturan/pendaftaran
 *
 * Halaman ini digunakan oleh panitia MRC untuk:
 * - Melihat daftar event MRC (semua edisi)
 * - Membuat event baru
 * - Mengubah status pendaftaran (buka/tutup)
 * - Mengatur jadwal pendaftaran (waktu buka & tutup)
 *
 * Alur status event:
 * draft → registration → closed → ongoing → completed
 *         ↑______________________________|
 *         (bisa dibuka ulang dari closed)
 *
 * Catatan:
 * - Proteksi autentikasi dilakukan di layout.tsx (private)
 * - Data diambil server-side via server action
 * - Memerlukan permission 'mrc:manage'
 */

import { Suspense } from 'react'
import { Trophy, Info } from 'lucide-react'

import { getMrcEvents } from '@/app/actions/mrc.action'
import {
  MrcRegistrationManager,
  MrcRegistrationSkeleton,
} from '@/components/mrc/mrc-registration-manager'

export default function MrcPendaftaranPage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <Trophy className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Buka/Tutup Pendaftaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola status pendaftaran dan jadwal event Minangkabau Robot Contest.
          </p>
        </div>
      </div>

      {/* Panduan singkat */}
      <div className="flex items-start gap-3 rounded-xl border bg-blue-500/5 p-4">
        <Info className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Alur Status Event</p>
          <p>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">Draf</span>
            {' → '}
            <span className="font-mono text-emerald-600 dark:text-emerald-400">Pendaftaran Dibuka</span>
            {' → '}
            <span className="font-mono text-amber-600 dark:text-amber-400">Pendaftaran Ditutup</span>
            {' → '}
            <span className="font-mono text-blue-600 dark:text-blue-400">Berlangsung</span>
            {' → '}
            <span className="font-mono text-violet-600 dark:text-violet-400">Selesai</span>
          </p>
          <p>
            Anda bisa membuka ulang pendaftaran dari status
            &quot;Ditutup&quot; jika diperlukan.
          </p>
        </div>
      </div>

      {/* Konten dengan Suspense */}
      <Suspense fallback={<MrcRegistrationSkeleton />}>
        <MrcRegistrationLoader />
      </Suspense>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN ASYNC: Loader data event
// ═════════════════════════════════════════════════════

/**
 * MrcRegistrationLoader — Memuat data event MRC secara server-side.
 * Dipisahkan agar bisa dibungkus Suspense boundary.
 */
async function MrcRegistrationLoader() {
  const result = await getMrcEvents()

  // Error state
  if (result.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">{result.error}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Silakan muat ulang halaman atau hubungi administrator.
        </p>
      </div>
    )
  }

  return <MrcRegistrationManager events={result.data ?? []} />
}
