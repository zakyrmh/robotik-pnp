/**
 * Halaman Dashboard — /dashboard
 *
 * Halaman utama setelah user berhasil login.
 * Mendeteksi role user:
 * - Caang → Tampilkan Registration Wizard (pendaftaran step-by-step)
 * - Lainnya → Tampilkan dashboard umum
 *
 * Catatan: Proteksi autentikasi dilakukan di layout.tsx (private).
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Check user roles
  const { data: userRolesData } = await supabase
    .from('user_roles')
    .select('roles ( name )')
    .eq('user_id', user.id)

  const userRoles: string[] = (userRolesData ?? [])
    .map((row) => {
      const role = row.roles
      if (Array.isArray(role)) return role[0]?.name ?? null
      if (role && typeof role === 'object' && 'name' in role) return (role as { name: string }).name
      return null
    })
    .filter((name): name is string => name !== null)

  const isCaang = userRoles.includes('caang') && !userRoles.includes('admin') && !userRoles.includes('super_admin') && !userRoles.includes('pengurus') && !userRoles.includes('anggota')

  if (isCaang) {
    // Dynamic import caang content to keep bundle smaller
    const { CaangDashboard } = await import('@/components/or/caang-dashboard')
    return <CaangDashboard />
  }

  // Default dashboard for other roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang{profile?.full_name ? `, ${profile.full_name}` : ''}! Ini adalah Sistem Informasi UKM Robotik PNP.
        </p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {[
          { label: 'Total Anggota', value: '—' },
          { label: 'Calon Anggota', value: '—' },
          { label: 'Kegiatan Aktif', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-colors"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card p-6 shadow-sm md:col-span-4">
          <h2 className="mb-4 text-sm font-semibold">Aktivitas Terbaru</h2>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Konten akan ditambahkan nanti
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm md:col-span-3">
          <h2 className="mb-4 text-sm font-semibold">Pengumuman</h2>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Konten akan ditambahkan nanti
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 rounded mb-2" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
