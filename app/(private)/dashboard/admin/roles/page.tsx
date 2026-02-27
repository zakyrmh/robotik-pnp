/**
 * Halaman Manajemen Akun & Role — /dashboard/admin/roles
 *
 * Halaman Super Admin untuk melihat dan mengelola semua user
 * beserta role sistem yang dimiliki.
 *
 * Fitur:
 * - Tabel daftar user dengan profil, role, dan status
 * - Pencarian berdasarkan nama atau email
 * - Lihat detail user via slide-over sheet
 * - Edit role, status, reset password, hapus akun via edit sheet
 * - Error handling dengan pesan yang informatif
 *
 * Catatan:
 * - Proteksi autentikasi dilakukan di layout.tsx (private)
 * - Data diambil server-side via server action
 */

import { Suspense } from 'react'
import { Crown } from 'lucide-react'

import { getUsers, getAllRoles } from '@/app/actions/admin.action'
import { UsersTable, UsersTableSkeleton } from '@/components/admin/users-table'

export default function ManajemenRolePage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Crown className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Akun & Role
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun pengguna dan atur role sistem untuk mengontrol hak akses
            fitur.
          </p>
        </div>
      </div>

      {/* Tabel user dengan Suspense boundary */}
      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTableLoader />
      </Suspense>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: Loader data async
// ═════════════════════════════════════════════════════

/**
 * UsersTableLoader — Komponen async yang memuat data user dan role
 *
 * Dipisahkan dari halaman utama agar bisa dibungkus Suspense,
 * sehingga halaman bisa menampilkan skeleton saat data dimuat.
 * Memuat users dan roles secara paralel untuk performa optimal.
 */
async function UsersTableLoader() {
  // Fetch paralel: users + roles
  const [usersResult, rolesResult] = await Promise.all([
    getUsers(),
    getAllRoles(),
  ])

  // Tampilkan pesan error jika gagal memuat data
  if (usersResult.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">
          {usersResult.error}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Silakan muat ulang halaman atau hubungi administrator.
        </p>
      </div>
    )
  }

  return (
    <UsersTable
      users={usersResult.data ?? []}
      allRoles={rolesResult.data ?? []}
    />
  )
}
