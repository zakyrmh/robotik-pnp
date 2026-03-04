'use client'

/**
 * MrcCategoryManager — Komponen client untuk mengelola
 * kategori lomba dan biaya pendaftaran MRC.
 *
 * Fitur:
 * - Pilih event MRC untuk melihat kategori-nya
 * - Tabel kategori dengan info biaya, ukuran tim, kuota
 * - Tambah kategori baru via dialog form
 * - Edit kategori inline via dialog
 * - Toggle aktif/nonaktif kategori
 * - Hapus kategori dengan konfirmasi
 * - Format biaya dalam Rupiah
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  Users,
  Banknote,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  FolderOpen,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  getCategoriesByEvent,
  createMrcCategory,
  updateMrcCategory,
  deleteMrcCategory,
} from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type { MrcCategory } from '@/lib/db/schema/mrc'
import { MRC_STATUS_LABELS, type MrcEventStatus } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════

/** Format angka ke Rupiah */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Konfigurasi visual untuk status event */
const STATUS_CONFIG: Record<MrcEventStatus, string> = {
  draft: 'bg-zinc-500/15 text-zinc-700 border-zinc-500/25 dark:text-zinc-400',
  registration: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
  closed: 'bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400',
  ongoing: 'bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400',
  completed: 'bg-violet-500/15 text-violet-700 border-violet-500/25 dark:text-violet-400',
  cancelled: 'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400',
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface MrcCategoryManagerProps {
  /** Daftar event MRC yang tersedia */
  events: MrcEventWithStats[]
}

export function MrcCategoryManager({ events }: MrcCategoryManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Event terpilih
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const selectedEvent = events.find((e) => e.id === selectedEventId)

  // Kategori
  const [categories, setCategories] = useState<MrcCategory[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)

  // Feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  /** Muat kategori untuk event terpilih */
  const loadCategories = useCallback(
    (eventId: string) => {
      setSelectedEventId(eventId)
      setCategoriesLoaded(false)

      startTransition(async () => {
        const result = await getCategoriesByEvent(eventId)
        if (result.data) {
          setCategories(result.data)
        } else {
          setFeedback({ type: 'error', message: result.error ?? 'Gagal memuat kategori.' })
        }
        setCategoriesLoaded(true)
      })
    },
    [startTransition]
  )

  /** Muat kategori saat event pertama kali dipilih */
  const handleEventChange = (eventId: string) => {
    setFeedback(null)
    loadCategories(eventId)
  }

  // Auto-load pertama via useEffect (tidak boleh di body render)
  useEffect(() => {
    if (selectedEventId) {
      loadCategories(selectedEventId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Callback setelah CRUD berhasil */
  const onCategoryChanged = () => {
    loadCategories(selectedEventId)
    router.refresh()
  }

  /** Handler: Toggle aktif */
  const handleToggleActive = (category: MrcCategory) => {
    startTransition(async () => {
      setFeedback(null)
      const result = await updateMrcCategory(category.id, {
        is_active: !category.is_active,
      })
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({
          type: 'success',
          message: `Kategori "${category.name}" ${category.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`,
        })
        onCategoryChanged()
      }
    })
  }

  /** Handler: Hapus kategori */
  const handleDelete = (category: MrcCategory) => {
    startTransition(async () => {
      setFeedback(null)
      const result = await deleteMrcCategory(category.id)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({
          type: 'success',
          message: `Kategori "${category.name}" berhasil dihapus.`,
        })
        onCategoryChanged()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Event selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Pilih Event</Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Pilih event MRC" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <span className="flex items-center gap-2">
                    {event.name}
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 ${STATUS_CONFIG[event.status]}`}
                    >
                      {MRC_STATUS_LABELS[event.status]}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEvent && (
          <CategoryFormDialog
            eventId={selectedEventId}
            onCreated={onCategoryChanged}
          />
        )}
      </div>

      {/* Feedback */}
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

      {/* Ringkasan event */}
      {selectedEvent && (
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat
            icon={FolderOpen}
            label="Kategori"
            value={`${categories.length} kategori`}
          />
          <MiniStat
            icon={Banknote}
            label="Rentang Biaya"
            value={
              categories.length > 0
                ? `${formatRupiah(Math.min(...categories.map((c) => c.registration_fee)))} – ${formatRupiah(Math.max(...categories.map((c) => c.registration_fee)))}`
                : '—'
            }
          />
          <MiniStat
            icon={Users}
            label="Kategori Aktif"
            value={`${categories.filter((c) => c.is_active).length} / ${categories.length}`}
          />
        </div>
      )}

      {/* Tabel kategori */}
      {!categoriesLoaded && isPending ? (
        <CategoryTableSkeleton />
      ) : categories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Biaya</TableHead>
                <TableHead className="text-center">Tim</TableHead>
                <TableHead className="text-center">Kuota</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  eventId={selectedEventId}
                  isPending={isPending}
                  onToggleActive={() => handleToggleActive(cat)}
                  onDelete={() => handleDelete(cat)}
                  onUpdated={onCategoryChanged}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Baris kategori di tabel
// ═════════════════════════════════════════════════════

function CategoryRow({
  category,
  eventId,
  isPending,
  onToggleActive,
  onDelete,
  onUpdated,
}: {
  category: MrcCategory
  eventId: string
  isPending: boolean
  onToggleActive: () => void
  onDelete: () => void
  onUpdated: () => void
}) {
  return (
    <TableRow className={!category.is_active ? 'opacity-50' : ''}>
      {/* Nama & deskripsi */}
      <TableCell>
        <div className="min-w-[160px]">
          <p className="text-sm font-medium">{category.name}</p>
          {category.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {category.description}
            </p>
          )}
          {category.rules_url && (
            <a
              href={category.rules_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-0.5"
            >
              <ExternalLink className="size-3" />
              Peraturan
            </a>
          )}
        </div>
      </TableCell>

      {/* Biaya */}
      <TableCell className="text-right font-mono text-sm whitespace-nowrap">
        {formatRupiah(category.registration_fee)}
      </TableCell>

      {/* Ukuran tim */}
      <TableCell className="text-center text-xs whitespace-nowrap">
        {category.min_team_size}–{category.max_team_size} orang
      </TableCell>

      {/* Kuota */}
      <TableCell className="text-center text-xs">
        {category.max_teams ?? '∞'}
      </TableCell>

      {/* Status aktif */}
      <TableCell className="text-center">
        <button
          type="button"
          className="cursor-pointer"
          disabled={isPending}
          onClick={onToggleActive}
          title={category.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        >
          {category.is_active ? (
            <ToggleRight className="size-5 text-emerald-500" />
          ) : (
            <ToggleLeft className="size-5 text-zinc-400" />
          )}
        </button>
      </TableCell>

      {/* Aksi */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Edit */}
          <CategoryFormDialog
            eventId={eventId}
            editCategory={category}
            onCreated={onUpdated}
          />

          {/* Hapus */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive cursor-pointer"
                disabled={isPending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-destructive" />
                  Hapus Kategori
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Kategori <strong>{category.name}</strong> akan dihapus
                  permanen. Jika sudah ada peserta terdaftar, data mereka juga
                  akan terpengaruh.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ya, Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Dialog form tambah/edit kategori
// ═════════════════════════════════════════════════════

function CategoryFormDialog({
  eventId,
  editCategory,
  onCreated,
}: {
  eventId: string
  editCategory?: MrcCategory
  onCreated: () => void
}) {
  const isEdit = !!editCategory
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(editCategory?.name ?? '')
  const [description, setDescription] = useState(editCategory?.description ?? '')
  const [rulesUrl, setRulesUrl] = useState(editCategory?.rules_url ?? '')
  const [fee, setFee] = useState(String(editCategory?.registration_fee ?? 0))
  const [minTeam, setMinTeam] = useState(String(editCategory?.min_team_size ?? 1))
  const [maxTeam, setMaxTeam] = useState(String(editCategory?.max_team_size ?? 3))
  const [maxTeams, setMaxTeams] = useState(
    editCategory?.max_teams != null ? String(editCategory.max_teams) : ''
  )

  const resetForm = () => {
    setName(editCategory?.name ?? '')
    setDescription(editCategory?.description ?? '')
    setRulesUrl(editCategory?.rules_url ?? '')
    setFee(String(editCategory?.registration_fee ?? 0))
    setMinTeam(String(editCategory?.min_team_size ?? 1))
    setMaxTeam(String(editCategory?.max_team_size ?? 3))
    setMaxTeams(editCategory?.max_teams != null ? String(editCategory.max_teams) : '')
    setError(null)
  }

  const handleSubmit = () => {
    if (name.length < 2) {
      setError('Nama kategori minimal 2 karakter.')
      return
    }

    const parsedFee = parseInt(fee) || 0
    const parsedMin = parseInt(minTeam) || 1
    const parsedMax = parseInt(maxTeam) || 3
    const parsedMaxTeams = maxTeams ? parseInt(maxTeams) : null

    if (parsedMin > parsedMax) {
      setError('Min anggota tim harus ≤ max anggota tim.')
      return
    }

    startTransition(async () => {
      setError(null)

      if (isEdit) {
        const result = await updateMrcCategory(editCategory.id, {
          name,
          description: description || null,
          rules_url: rulesUrl || null,
          registration_fee: parsedFee,
          min_team_size: parsedMin,
          max_team_size: parsedMax,
          max_teams: parsedMaxTeams,
        })
        if (result.error) {
          setError(result.error)
          return
        }
      } else {
        const result = await createMrcCategory({
          event_id: eventId,
          name,
          description: description || null,
          rules_url: rulesUrl || null,
          registration_fee: parsedFee,
          min_team_size: parsedMin,
          max_team_size: parsedMax,
          max_teams: parsedMaxTeams,
        })
        if (result.error) {
          setError(result.error)
          return
        }
      }

      setOpen(false)
      resetForm()
      onCreated()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm" className="cursor-pointer">
            <Plus className="size-4" />
            Tambah Kategori
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui data kategori lomba dan biaya pendaftaran.'
              : 'Tambahkan kategori lomba baru ke event ini.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nama Kategori *</Label>
            <Input
              id="cat-name"
              placeholder="Line Follower"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Deskripsi</Label>
            <Input
              id="cat-desc"
              placeholder="Deskripsi singkat kategori lomba"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* URL Peraturan */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-rules">URL Peraturan</Label>
            <Input
              id="cat-rules"
              type="url"
              placeholder="https://drive.google.com/..."
              value={rulesUrl}
              onChange={(e) => setRulesUrl(e.target.value)}
            />
          </div>

          <Separator />

          {/* Biaya */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-fee">Biaya Pendaftaran (Rp)</Label>
            <Input
              id="cat-fee"
              type="number"
              min={0}
              placeholder="150000"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Isi 0 jika gratis. Biaya per tim.
            </p>
          </div>

          {/* Ukuran tim */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-min">Min Anggota</Label>
              <Input
                id="cat-min"
                type="number"
                min={1}
                max={20}
                value={minTeam}
                onChange={(e) => setMinTeam(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-max">Max Anggota</Label>
              <Input
                id="cat-max"
                type="number"
                min={1}
                max={20}
                value={maxTeam}
                onChange={(e) => setMaxTeam(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-quota">Kuota Tim</Label>
              <Input
                id="cat-quota"
                type="number"
                min={1}
                placeholder="∞"
                value={maxTeams}
                onChange={(e) => setMaxTeams(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Kosongkan = tidak terbatas.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full cursor-pointer"
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN KECIL: MiniStat, Empty, Skeleton
// ═════════════════════════════════════════════════════

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
        <Icon className="size-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <FolderOpen className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Belum ada kategori lomba</p>
      <p className="text-xs text-muted-foreground max-w-[280px]">
        Klik &quot;Tambah Kategori&quot; untuk menambahkan kategori lomba dan
        mengatur biaya pendaftaran.
      </p>
    </div>
  )
}

function CategoryTableSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-10 rounded" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// SKELETON HALAMAN (Export untuk Suspense)
// ═════════════════════════════════════════════════════

export function MrcCategorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-9 w-[280px] rounded-md" />
        </div>
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
          >
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
      <CategoryTableSkeleton />
    </div>
  )
}
