'use client'

/**
 * AppSidebar — Komponen sidebar utama untuk dashboard
 *
 * Menampilkan menu navigasi yang difilter berdasarkan role user.
 * Menggunakan Shadcn Sidebar dengan fitur:
 * - Collapsible sub-menu (expand/collapse per group)
 * - Responsif: di mobile tampil sebagai off-canvas sheet
 * - Di desktop mendukung mode icon-only (collapsed)
 * - Logo UKM Robotik di header
 * - User nav (profil + logout) di footer
 *
 * Menu diambil dari konfigurasi `lib/sidebar-navigation.ts`
 * dan difilter menggunakan `filterMenuByRoles()`.
 */

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { SidebarUserNav } from '@/components/dashboard/sidebar-user-nav'
import {
  filterMenuByRoles,
  type SidebarMenuGroup,
  type SidebarMenuItem as NavItem,
} from '@/lib/sidebar-navigation'

// ═════════════════════════════════════════════════════
// TIPE PROPERTI
// ═════════════════════════════════════════════════════

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /** Daftar nama role yang dimiliki user */
  userRoles: string[]
  /** Informasi user untuk ditampilkan di footer */
  user: {
    email: string
    fullName: string
    avatarUrl?: string | null
  }
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: Render item menu tunggal
// ═════════════════════════════════════════════════════

/**
 * NavItemDirect — Item menu tanpa sub-menu (link langsung)
 */
function NavItemDirect({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
      >
        <Link href={item.href!}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * NavItemCollapsible — Item menu dengan sub-menu yang bisa di-collapse
 *
 * Otomatis terbuka jika salah satu sub-menu sedang aktif (URL cocok).
 */
function NavItemCollapsible({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  /** Cek apakah ada sub-item yang aktif (URL cocok) */
  const hasActiveChild = item.subItems?.some(
    (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
  )

  return (
    <Collapsible asChild defaultOpen={hasActiveChild} className="group/collapsible">
      <SidebarMenuItem>
        {/* Trigger: tombol utama untuk expand/collapse */}
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            <item.icon />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        {/* Konten: daftar sub-menu */}
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems!.map((sub) => (
              <SidebarMenuSubItem key={sub.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={
                    pathname === sub.href ||
                    pathname.startsWith(sub.href + '/')
                  }
                >
                  <Link href={sub.href}>
                    <span>{sub.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: Render grup menu
// ═════════════════════════════════════════════════════

/**
 * NavGroup — Render satu grup menu (label + daftar item)
 */
function NavGroup({
  group,
  pathname,
}: {
  group: SidebarMenuGroup
  pathname: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          // Jika punya subItems → render Collapsible
          if (item.subItems && item.subItems.length > 0) {
            return (
              <NavItemCollapsible
                key={item.title}
                item={item}
                pathname={pathname}
              />
            )
          }

          // Jika tidak ada subItems → render link langsung
          const isActive =
            pathname === item.href ||
            pathname.startsWith((item.href ?? '') + '/')

          return (
            <NavItemDirect
              key={item.title}
              item={item}
              isActive={isActive}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA: AppSidebar
// ═════════════════════════════════════════════════════

export function AppSidebar({ userRoles, user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  /** Filter menu berdasarkan role user */
  const visibleGroups = filterMenuByRoles(userRoles)

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Header: Logo UKM Robotik PNP ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="UKM Robotik PNP">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/images/logo.png"
                    alt="Logo UKM Robotik PNP"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">UKM Robotik</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Politeknik Negeri Padang
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ── Konten: Menu navigasi yang difilter ── */}
      <SidebarContent>
        {/* Menu Dashboard utama (selalu tampil untuk semua role) */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Menu per role — difilter berdasarkan role user */}
        {visibleGroups.map((group) => (
          <NavGroup key={group.label} group={group} pathname={pathname} />
        ))}
      </SidebarContent>

      {/* ── Footer: Profil user dan logout ── */}
      <SidebarFooter>
        <SidebarUserNav user={user} />
      </SidebarFooter>

      {/* Rail untuk resize sidebar di desktop */}
      <SidebarRail />
    </Sidebar>
  )
}
