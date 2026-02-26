/**
 * Layout untuk halaman private (dashboard dan lainnya)
 *
 * Layout ini hanya bisa diakses oleh user yang sudah login.
 * Jika belum login, user akan di-redirect ke halaman login.
 *
 * Fitur:
 * - Server-side auth check via Supabase
 * - Query role user dari tabel user_roles + roles
 * - Query profil user dari tabel profiles
 * - Menyediakan SidebarProvider yang membungkus AppSidebar + konten
 * - Menggunakan komponen Shadcn SidebarInset untuk area konten utama
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  // ── Langkah 1: Cek apakah user sudah login ──
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── Langkah 2: Ambil role user dari database ──
  const { data: userRolesData } = await supabase
    .from('user_roles')
    .select('roles ( name )')
    .eq('user_id', user.id)

  // Ekstrak nama role menjadi array string
  const userRoles: string[] = (userRolesData ?? [])
    .map((row) => {
      // Handle case: roles bisa berupa object atau array
      const role = row.roles
      if (Array.isArray(role)) return role[0]?.name ?? null
      if (role && typeof role === 'object' && 'name' in role) return (role as { name: string }).name
      return null
    })
    .filter((name): name is string => name !== null)

  // ── Langkah 3: Ambil profil user ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .single()

  // Siapkan data user untuk sidebar
  const sidebarUser = {
    email: user.email ?? '',
    fullName: profile?.full_name ?? '',
    avatarUrl: profile?.avatar_url ?? null,
  }

  return (
    <SidebarProvider>
      {/* Sidebar navigasi dengan menu yang difilter per role */}
      <AppSidebar userRoles={userRoles} user={sidebarUser} />

      {/* Area konten utama */}
      <SidebarInset>
        <DashboardHeader />

        {/* Konten halaman (children dari page.tsx) */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
