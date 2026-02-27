'use client'

/**
 * UserDetailSheet — Panel detail user yang muncul dari samping
 *
 * Menampilkan informasi lengkap user yang dipilih dari tabel,
 * menggunakan komponen Shadcn Sheet (slide-over panel).
 * Responsif: di mobile full-width, di desktop dari sisi kanan.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { RoleBadge } from '@/components/admin/role-badge'
import { StatusBadge } from '@/components/admin/status-badge'
import type { UserWithRoles } from '@/lib/types/admin'

interface UserDetailSheetProps {
  /** User yang sedang dipilih (null jika sheet tertutup) */
  user: UserWithRoles | null
  /** State buka/tutup sheet */
  open: boolean
  /** Callback saat sheet ditutup */
  onOpenChange: (open: boolean) => void
}

/** Menghasilkan inisial dari nama lengkap */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

/** Format tanggal ISO ke format yang mudah dibaca */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Ekstrak nama role dari data user_roles */
function extractRoles(user: UserWithRoles): string[] {
  return user.user_roles
    .map((ur) => ur.roles?.name)
    .filter((name): name is string => !!name)
}

export function UserDetailSheet({
  user,
  open,
  onOpenChange,
}: UserDetailSheetProps) {
  if (!user) return null

  const fullName = user.profiles?.full_name ?? 'Tanpa Nama'
  const roles = extractRoles(user)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detail Pengguna</SheetTitle>
          <SheetDescription>
            Informasi lengkap akun dan role pengguna.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          {/* Profil user */}
          <div className="flex items-center gap-4">
            <Avatar className="size-14 rounded-xl">
              <AvatarImage
                src={user.profiles?.avatar_url ?? undefined}
                alt={fullName}
              />
              <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-base font-semibold leading-tight">{fullName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Detail informasi */}
          <div className="space-y-4">
            {/* Status akun */}
            <DetailRow label="Status Akun">
              <StatusBadge status={user.status} />
            </DetailRow>

            {/* Role */}
            <DetailRow label="Role Sistem">
              <div className="flex flex-wrap gap-1.5">
                {roles.length > 0 ? (
                  roles.map((role) => <RoleBadge key={role} role={role} />)
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Belum ada role
                  </span>
                )}
              </div>
            </DetailRow>

            {/* Telepon */}
            <DetailRow label="No. Telepon">
              <span className="text-sm">
                {user.profiles?.phone ?? (
                  <span className="text-muted-foreground">Belum diisi</span>
                )}
              </span>
            </DetailRow>

            {/* Tanggal bergabung */}
            <DetailRow label="Bergabung">
              <span className="text-sm">{formatDate(user.created_at)}</span>
            </DetailRow>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: Baris detail (label + konten)
// ═════════════════════════════════════════════════════

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  )
}
