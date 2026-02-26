'use client'

/**
 * SidebarUserNav — Komponen navigasi user di footer sidebar
 *
 * Menampilkan avatar, nama, dan email user yang sedang login.
 * Di dalam dropdown menu terdapat opsi untuk logout.
 * Menggunakan Shadcn DropdownMenu di atas Sidebar footer.
 */

import { LogOut, ChevronsUpDown } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { logout } from '@/app/actions/auth.action'

/** Properti yang dibutuhkan komponen */
interface SidebarUserNavProps {
  user: {
    email: string
    fullName: string
    avatarUrl?: string | null
  }
}

/**
 * Menghasilkan inisial dari nama lengkap.
 * Contoh: "Muhammad Rizki" → "MR"
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export function SidebarUserNav({ user }: SidebarUserNavProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Avatar user */}
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={user.avatarUrl ?? undefined}
                  alt={user.fullName}
                />
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(user.fullName || user.email)}
                </AvatarFallback>
              </Avatar>

              {/* Info nama dan email */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.fullName || 'Pengguna'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* Dropdown menu */}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            {/* Info user di bagian atas dropdown */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage
                    src={user.avatarUrl ?? undefined}
                    alt={user.fullName}
                  />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(user.fullName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.fullName || 'Pengguna'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Tombol logout */}
            <form action={logout}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Keluar
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
