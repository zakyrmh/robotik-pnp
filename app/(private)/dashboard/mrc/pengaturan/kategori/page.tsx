/**
 * Halaman Kategori Lomba & Biaya — /dashboard/mrc/pengaturan/kategori
 *
 * Halaman ini digunakan oleh panitia MRC untuk:
 * - Menambah, mengedit, dan menghapus kategori lomba
 * - Mengatur biaya pendaftaran per kategori
 * - Menentukan ukuran tim (min/max anggota)
 * - Mengatur kuota maksimal tim per kategori
 * - Mengaktifkan/menonaktifkan kategori
 *
 * Setiap kategori terikat pada satu event MRC.
 * User memilih event terlebih dahulu, lalu mengelola
 * kategori di dalamnya.
 *
 * Catatan:
 * - Proteksi autentikasi dilakukan di layout.tsx (private)
 * - Data event dimuat server-side, kategori dimuat client-side
 * - Memerlukan permission 'mrc:manage'
 */

import { Suspense } from 'react'
import { Layers, Info } from 'lucide-react'

import { getMrcEvents } from '@/app/actions/mrc.action'
import {
  MrcCategoryManager,
  MrcCategorySkeleton,
} from '@/components/mrc/mrc-category-manager'

export default function MrcKategoriPage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <Layers className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kategori Lomba & Biaya
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola kategori lomba, biaya pendaftaran, dan konfigurasi tim.
          </p>
        </div>
      </div>

      {/* Panduan singkat */}
      <div className="flex items-start gap-3 rounded-xl border bg-blue-500/5 p-4">
        <Info className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Panduan</p>
          <p>
            Pilih event MRC, lalu kelola kategori lomba di dalamnya. Setiap
            kategori memiliki biaya pendaftaran, batas anggota tim, dan kuota
            opsional. Kategori yang dinonaktifkan tidak akan muncul di form
            pendaftaran peserta.
          </p>
        </div>
      </div>

      {/* Konten dengan Suspense */}
      <Suspense fallback={<MrcCategorySkeleton />}>
        <CategoryPageLoader />
      </Suspense>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN ASYNC: Loader data event
// ═════════════════════════════════════════════════════

/**
 * CategoryPageLoader — Memuat daftar event MRC secara server-side.
 * Kategori akan dimuat client-side saat user memilih event.
 */
async function CategoryPageLoader() {
  const result = await getMrcEvents()

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

  const events = result.data ?? []

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">Belum ada event MRC</p>
        <p className="text-xs text-muted-foreground max-w-[300px]">
          Buat event terlebih dahulu di halaman{' '}
          <a
            href="/dashboard/mrc/pengaturan/pendaftaran"
            className="text-blue-600 hover:underline"
          >
            Buka/Tutup Pendaftaran
          </a>
          .
        </p>
      </div>
    )
  }

  return <MrcCategoryManager events={events} />
}
