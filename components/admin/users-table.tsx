'use client'

/**
 * UsersTable — Tabel daftar user untuk halaman Manajemen Akun & Role
 *
 * Komponen client-side yang menampilkan daftar user dalam format tabel
 * dengan fitur:
 * - Kolom: Nama, Email, Role, Status, Tanggal Bergabung, Aksi
 * - Tombol aksi: Lihat detail (Sheet), Edit (Sheet)
 * - Pencarian real-time berdasarkan nama atau email
 * - Responsif: di mobile kolom tertentu di-hide
 * - State kosong dan loading skeleton
 */

import { useState } from 'react'
import { Eye, Pencil, Users, Search } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleBadge } from '@/components/admin/role-badge'
import { StatusBadge } from '@/components/admin/status-badge'
import { UserDetailSheet } from '@/components/admin/user-detail-sheet'
import { UserEditSheet } from '@/components/admin/user-edit-sheet'
import type { UserWithRoles } from '@/lib/types/admin'

interface UsersTableProps {
  /** Daftar user yang akan ditampilkan */
  users: UserWithRoles[]
  /** Daftar semua role sistem (untuk form edit) */
  allRoles: { id: string; name: string }[]
}

// ═════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════

/** Menghasilkan inisial dari nama */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

/** Ekstrak nama role dari data user_roles */
function extractRoles(user: UserWithRoles): string[] {
  return user.user_roles
    .map((ur) => ur.roles?.name)
    .filter((name): name is string => !!name)
}

/** Format tanggal singkat */
function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

export function UsersTable({ users, allRoles }: UsersTableProps) {
  /** User yang sedang dilihat detailnya */
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null)
  /** State buka/tutup sheet detail */
  const [detailOpen, setDetailOpen] = useState(false)
  /** User yang sedang diedit */
  const [editUser, setEditUser] = useState<UserWithRoles | null>(null)
  /** State buka/tutup sheet edit */
  const [editOpen, setEditOpen] = useState(false)
  /** Kata kunci pencarian */
  const [search, setSearch] = useState('')

  /** Filter user berdasarkan pencarian (nama atau email) */
  const filteredUsers = users.filter((user) => {
    if (!search.trim()) return true
    const query = search.toLowerCase()
    const name = user.profiles?.full_name?.toLowerCase() ?? ''
    const email = user.email.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  /** Handler untuk tombol "Lihat" */
  const handleView = (user: UserWithRoles) => {
    setSelectedUser(user)
    setDetailOpen(true)
  }

  /** Handler untuk tombol "Edit" */
  const handleEdit = (user: UserWithRoles) => {
    setEditUser(user)
    setEditOpen(true)
  }

  return (
    <>
      {/* Baris pencarian */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} pengguna
        </div>
      </div>

      {/* Tabel user */}
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Pengguna</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Bergabung</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onView={() => handleView(user)}
                  onEdit={() => handleEdit(user)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheet detail user */}
      <UserDetailSheet
        user={selectedUser}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Sheet edit user */}
      <UserEditSheet
        user={editUser}
        allRoles={allRoles}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: Baris user dalam tabel
// ═════════════════════════════════════════════════════

function UserRow({
  user,
  onView,
  onEdit,
}: {
  user: UserWithRoles
  onView: () => void
  onEdit: () => void
}) {
  const fullName = user.profiles?.full_name ?? 'Tanpa Nama'
  const roles = extractRoles(user)

  return (
    <TableRow className="group">
      {/* Kolom: Avatar + Nama */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage
              src={user.profiles?.avatar_url ?? undefined}
              alt={fullName}
            />
            <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-medium text-primary">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">{fullName}</span>
            {/* Email di bawah nama — hanya tampil di mobile (kolom email hidden) */}
            <span className="text-xs text-muted-foreground md:hidden">
              {user.email}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Kolom: Email (hidden di mobile) */}
      <TableCell className="hidden md:table-cell">
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </TableCell>

      {/* Kolom: Role badges */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {roles.length > 0 ? (
            roles.map((role) => <RoleBadge key={role} role={role} />)
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>

      {/* Kolom: Status (hidden di mobile kecil) */}
      <TableCell className="hidden sm:table-cell">
        <StatusBadge status={user.status} />
      </TableCell>

      {/* Kolom: Tanggal (hidden di tablet ke bawah) */}
      <TableCell className="hidden lg:table-cell">
        <span className="text-sm text-muted-foreground">
          {formatDateShort(user.created_at)}
        </span>
      </TableCell>

      {/* Kolom: Tombol aksi */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            onClick={onView}
            title="Lihat detail"
          >
            <Eye className="size-4" />
            <span className="sr-only">Lihat detail</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            onClick={onEdit}
            title="Edit akun"
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit akun</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: State kosong
// ═════════════════════════════════════════════════════

function EmptyState({ search }: { search: string }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-48">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {search ? 'Tidak ada hasil' : 'Belum ada pengguna'}
          </p>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            {search
              ? `Tidak ditemukan pengguna dengan kata kunci "${search}".`
              : 'Data pengguna akan muncul di sini saat sudah terdaftar.'}
          </p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: Loading skeleton
// ═════════════════════════════════════════════════════

/** Skeleton loading untuk tabel (digunakan saat data sedang dimuat) */
export function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Pengguna</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Bergabung</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-40 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-24 rounded" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Skeleton className="size-8 rounded" />
                    <Skeleton className="size-8 rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
