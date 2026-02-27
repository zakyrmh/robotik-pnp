'use client'

/**
 * UserEditSheet — Panel edit akun user (slide-over dari samping)
 *
 * Fitur yang bisa dilakukan Super Admin:
 * 1. Mengubah role user (multi-select checkbox)
 * 2. Mengubah status akun (active, inactive, banned)
 * 3. Mengirim email reset password
 * 4. Soft-delete (menonaktifkan) akun user
 *
 * Semua aksi menggunakan server actions dan
 * memiliki konfirmasi sebelum eksekusi.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  KeyRound,
  Loader2,
  Trash2,
  Save,
  AlertTriangle,
} from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/admin/role-badge'

import {
  updateUserStatus,
  updateUserRoles,
  resetUserPassword,
  deleteUser,
} from '@/app/actions/admin.action'
import type { UserWithRoles } from '@/lib/types/admin'

// ═════════════════════════════════════════════════════
// TIPE & KONSTANTA
// ═════════════════════════════════════════════════════

interface UserEditSheetProps {
  /** User yang sedang diedit (null jika sheet tertutup) */
  user: UserWithRoles | null
  /** Daftar semua role sistem yang tersedia */
  allRoles: { id: string; name: string }[]
  /** State buka/tutup sheet */
  open: boolean
  /** Callback saat sheet ditutup */
  onOpenChange: (open: boolean) => void
}

/** Opsi status akun */
const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'banned', label: 'Diblokir' },
] as const

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

/** Ekstrak role IDs dari data user */
function extractRoleIds(
  user: UserWithRoles,
  allRoles: { id: string; name: string }[]
): string[] {
  const userRoleNames = user.user_roles
    .map((ur) => ur.roles?.name)
    .filter((n): n is string => !!n)

  return allRoles
    .filter((r) => userRoleNames.includes(r.name))
    .map((r) => r.id)
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA (Wrapper)
// ═════════════════════════════════════════════════════

/**
 * UserEditSheet — Wrapper yang menangani null check
 *
 * Saat user berubah, key={user.id} pada UserEditForm
 * membuat React unmount+remount komponen, sehingga
 * semua state otomatis di-reset ke initial values.
 * Ini menghindari pelanggaran aturan React:
 * "Avoid calling setState synchronously within an effect".
 */
export function UserEditSheet({
  user,
  allRoles,
  open,
  onOpenChange,
}: UserEditSheetProps) {
  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <UserEditForm
          key={user.id}
          user={user}
          allRoles={allRoles}
          onOpenChange={onOpenChange}
        />
      </SheetContent>
    </Sheet>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN INTERNAL: Form edit (di-reset via key)
// ═════════════════════════════════════════════════════

function UserEditForm({
  user,
  allRoles,
  onOpenChange,
}: {
  user: UserWithRoles
  allRoles: { id: string; name: string }[]
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State di-init langsung dari props (key-based reset menangani sinkronisasi)
  const [selectedStatus, setSelectedStatus] = useState(user.status)
  const [selectedRoleIds, setSelectedRoleIds] = useState(() =>
    extractRoleIds(user, allRoles)
  )
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const fullName = user.profiles?.full_name ?? 'Tanpa Nama'

  // ── Handler: Toggle role (checkbox-like) ──
  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    )
  }

  // ── Handler: Simpan perubahan (status + role) ──
  const handleSave = () => {
    startTransition(async () => {
      setFeedback(null)

      // Simpan status
      if (selectedStatus !== user.status) {
        const result = await updateUserStatus(
          user.id,
          selectedStatus as 'active' | 'inactive' | 'banned'
        )
        if (result.error) {
          setFeedback({ type: 'error', message: result.error })
          return
        }
      }

      // Simpan role
      const originalRoleIds = extractRoleIds(user, allRoles)
      const rolesChanged =
        selectedRoleIds.length !== originalRoleIds.length ||
        selectedRoleIds.some((id) => !originalRoleIds.includes(id))

      if (rolesChanged) {
        const result = await updateUserRoles(user.id, selectedRoleIds)
        if (result.error) {
          setFeedback({ type: 'error', message: result.error })
          return
        }
      }

      setFeedback({ type: 'success', message: 'Perubahan berhasil disimpan.' })
      router.refresh()
    })
  }

  // ── Handler: Reset password ──
  const handleResetPassword = () => {
    startTransition(async () => {
      setFeedback(null)
      const result = await resetUserPassword(user.email)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({
          type: 'success',
          message: `Email reset password telah dikirim ke ${user.email}.`,
        })
      }
    })
  }

  // ── Handler: Hapus user ──
  const handleDelete = () => {
    startTransition(async () => {
      setFeedback(null)
      const result = await deleteUser(user.id)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({ type: 'success', message: 'Akun berhasil dihapus.' })
        router.refresh()
        // Tutup sheet setelah delay singkat agar user bisa baca pesan
        setTimeout(() => onOpenChange(false), 1500)
      }
    })
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit Akun & Role</SheetTitle>
        <SheetDescription>
          Kelola hak akses dan status akun pengguna.
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6 px-4 pb-24">
        {/* Profil user (read-only) */}
        <div className="flex items-center gap-4">
          <Avatar className="size-12 rounded-xl">
            <AvatarImage
              src={user.profiles?.avatar_url ?? undefined}
              alt={fullName}
            />
            <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-top-1 duration-200 ${
              feedback.type === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <Separator />

        {/* ── Bagian 1: Status Akun ── */}
        <div className="space-y-2">
          <Label htmlFor="user-status" className="text-sm font-medium">
            Status Akun
          </Label>
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger id="user-status" className="w-full">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Mengubah status akan langsung memengaruhi akses login user.
          </p>
        </div>

        <Separator />

        {/* ── Bagian 2: Role Sistem ── */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Role Sistem</Label>
          <p className="text-xs text-muted-foreground">
            Pilih satu atau lebih role untuk user ini.
          </p>
          <div className="space-y-2">
            {allRoles.map((role) => {
              const isChecked = selectedRoleIds.includes(role.id)
              return (
                <label
                  key={role.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    isChecked
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRole(role.id)}
                    className="size-4 rounded border-input accent-primary"
                  />
                  <RoleBadge role={role.name} />
                </label>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* ── Bagian 3: Reset Password ── */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Reset Password</Label>
          <p className="text-xs text-muted-foreground">
            Kirim link reset password ke email user. User akan diminta
            membuat password baru.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full cursor-pointer"
            disabled={isPending}
            onClick={handleResetPassword}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Kirim Email Reset Password
          </Button>
        </div>

        <Separator />

        {/* ── Bagian 4: Hapus Akun ── */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-destructive">
            Zona Bahaya
          </Label>
          <p className="text-xs text-muted-foreground">
            Menonaktifkan akun secara permanen (soft delete). User tidak akan
            bisa login lagi.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full cursor-pointer"
                disabled={isPending}
              >
                <Trash2 className="size-4" />
                Hapus Akun
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-destructive" />
                  Konfirmasi Hapus Akun
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Akun <strong>{fullName}</strong> ({user.email}) akan
                  dinonaktifkan secara permanen. User tidak akan bisa login
                  kembali. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Ya, Hapus Akun
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Footer: Tombol simpan (fixed di bawah) */}
      <SheetFooter className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
        <Button
          className="w-full cursor-pointer"
          disabled={isPending}
          onClick={handleSave}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Simpan Perubahan
        </Button>
      </SheetFooter>
    </>
  )
}

