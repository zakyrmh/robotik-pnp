'use client'

/**
 * MrcRegistrationManager — Komponen client untuk mengelola
 * pendaftaran event MRC (buka/tutup dan buat event baru).
 *
 * Fitur:
 * - Daftar event MRC dengan status dan statistik
 * - Buka/tutup pendaftaran dengan datetime picker
 * - Buat event baru via dialog form
 * - Status badge visual untuk setiap tahap event
 * - Feedback pesan sukses/error
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Loader2,
  CalendarDays,
  Clock,
  MapPin,
  ChevronRight,
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
  createMrcEvent,
  updateMrcRegistration,
  type MrcEventWithStats,
} from '@/app/actions/mrc.action'
import { MRC_STATUS_LABELS, type MrcEventStatus } from '@/lib/db/schema/mrc'

// ═════════════════════════════════════════════════════
// KONSTANTA
// ═════════════════════════════════════════════════════

/** Konfigurasi visual untuk status event */
const STATUS_CONFIG: Record<
  MrcEventStatus,
  { className: string; dotColor: string }
> = {
  draft: {
    className:
      'bg-zinc-500/15 text-zinc-700 border-zinc-500/25 dark:text-zinc-400',
    dotColor: 'bg-zinc-400',
  },
  registration: {
    className:
      'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  closed: {
    className:
      'bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  ongoing: {
    className:
      'bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
  completed: {
    className:
      'bg-violet-500/15 text-violet-700 border-violet-500/25 dark:text-violet-400',
    dotColor: 'bg-violet-500',
  },
  cancelled: {
    className:
      'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
}

/** Transisi status yang valid */
const VALID_TRANSITIONS: Record<MrcEventStatus, MrcEventStatus[]> = {
  draft: ['registration', 'cancelled'],
  registration: ['closed', 'cancelled'],
  closed: ['registration', 'ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['draft'],
}

// ═════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════

/** Format tanggal untuk tampilan */
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Generate slug otomatis dari nama */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ═════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═════════════════════════════════════════════════════

interface MrcRegistrationManagerProps {
  /** Data event awal yang dimuat di server */
  events: MrcEventWithStats[]
}

export function MrcRegistrationManager({
  events: initialEvents,
}: MrcRegistrationManagerProps) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  /** Refresh data setelah aksi */
  const refreshData = () => {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {events.length} event ditemukan
        </p>
        <CreateEventDialog
          onCreated={() => {
            refreshData()
          }}
        />
      </div>

      {/* Feedback global */}
      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Daftar event */}
      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isExpanded={expandedId === event.id}
              onToggle={() =>
                setExpandedId(expandedId === event.id ? null : event.id)
              }
              isPending={isPending}
              onStatusChange={(status, regOpen, regClose) => {
                startTransition(async () => {
                  setFeedback(null)
                  const result = await updateMrcRegistration(
                    event.id,
                    status,
                    regOpen,
                    regClose
                  )
                  if (result.error) {
                    setFeedback({ type: 'error', message: result.error })
                  } else {
                    setFeedback({
                      type: 'success',
                      message: `Status event "${event.name}" berhasil diubah ke "${MRC_STATUS_LABELS[status]}".`,
                    })
                    // Update local state
                    setEvents((prev) =>
                      prev.map((e) =>
                        e.id === event.id
                          ? {
                              ...e,
                              status,
                              registration_open: regOpen ?? e.registration_open,
                              registration_close: regClose ?? e.registration_close,
                            }
                          : e
                      )
                    )
                  }
                })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Kartu Event
// ═════════════════════════════════════════════════════

function EventCard({
  event,
  isExpanded,
  onToggle,
  isPending,
  onStatusChange,
}: {
  event: MrcEventWithStats
  isExpanded: boolean
  onToggle: () => void
  isPending: boolean
  onStatusChange: (
    status: MrcEventStatus,
    regOpen?: string | null,
    regClose?: string | null
  ) => void
}) {
  const statusConfig = STATUS_CONFIG[event.status]
  const validNextStatuses = VALID_TRANSITIONS[event.status]

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header — selalu visible */}
      <button
        type="button"
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-accent/50 cursor-pointer"
        onClick={onToggle}
      >
        <div
          className={`size-3 rounded-full shrink-0 ${statusConfig.dotColor}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{event.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium px-1.5 py-0 ${statusConfig.className}`}
            >
              {MRC_STATUS_LABELS[event.status]}
            </Badge>
            <span className="flex items-center gap-1">
              <FolderOpen className="size-3" />
              {event.category_count} kategori
            </span>
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {event.venue}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className={`size-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* Detail — expanded */}
      {isExpanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {/* Info jadwal */}
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={CalendarDays}
              label="Pendaftaran Dibuka"
              value={formatDate(event.registration_open)}
            />
            <InfoItem
              icon={Clock}
              label="Pendaftaran Ditutup"
              value={formatDate(event.registration_close)}
            />
            <InfoItem
              icon={CalendarDays}
              label="Event Mulai"
              value={formatDate(event.event_start)}
            />
            <InfoItem
              icon={CalendarDays}
              label="Event Selesai"
              value={formatDate(event.event_end)}
            />
          </div>

          <Separator />

          {/* Aksi status */}
          {validNextStatuses.length > 0 ? (
            <StatusActions
              event={event}
              validStatuses={validNextStatuses}
              isPending={isPending}
              onStatusChange={onStatusChange}
            />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Event sudah selesai — tidak ada aksi yang tersedia.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Aksi perubahan status
// ═════════════════════════════════════════════════════

function StatusActions({
  event,
  validStatuses,
  isPending,
  onStatusChange,
}: {
  event: MrcEventWithStats
  validStatuses: MrcEventStatus[]
  isPending: boolean
  onStatusChange: (
    status: MrcEventStatus,
    regOpen?: string | null,
    regClose?: string | null
  ) => void
}) {
  const [selectedStatus, setSelectedStatus] = useState(validStatuses[0])
  const [regOpen, setRegOpen] = useState(event.registration_open ?? '')
  const [regClose, setRegClose] = useState(event.registration_close ?? '')

  const needsSchedule = selectedStatus === 'registration'

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Ubah Status Pendaftaran</Label>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status Baru</Label>
          <Select
            value={selectedStatus}
            onValueChange={(v) => setSelectedStatus(v as MrcEventStatus)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {validStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'registration' ? (
                    <span className="flex items-center gap-2">
                      <ToggleRight className="size-3.5 text-emerald-500" />
                      {MRC_STATUS_LABELS[status]}
                    </span>
                  ) : status === 'closed' ? (
                    <span className="flex items-center gap-2">
                      <ToggleLeft className="size-3.5 text-amber-500" />
                      {MRC_STATUS_LABELS[status]}
                    </span>
                  ) : (
                    MRC_STATUS_LABELS[status]
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          className="cursor-pointer"
          disabled={isPending}
          onClick={() =>
            onStatusChange(
              selectedStatus,
              needsSchedule ? regOpen || null : undefined,
              needsSchedule ? regClose || null : undefined
            )
          }
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Terapkan
        </Button>
      </div>

      {/* Input jadwal pendaftaran (hanya saat membuka pendaftaran) */}
      {needsSchedule && (
        <div className="grid gap-3 sm:grid-cols-2 rounded-lg border bg-background p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`reg-open-${event.id}`} className="text-xs">
              Waktu Buka
            </Label>
            <Input
              id={`reg-open-${event.id}`}
              type="datetime-local"
              value={regOpen ? regOpen.slice(0, 16) : ''}
              onChange={(e) => setRegOpen(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`reg-close-${event.id}`} className="text-xs">
              Waktu Tutup
            </Label>
            <Input
              id={`reg-close-${event.id}`}
              type="datetime-local"
              value={regClose ? regClose.slice(0, 16) : ''}
              onChange={(e) => setRegClose(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Dialog buat event baru
// ═════════════════════════════════════════════════════

function CreateEventDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [venue, setVenue] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(toSlug(val))
  }

  const handleSubmit = () => {
    if (name.length < 3) {
      setError('Nama event minimal 3 karakter.')
      return
    }

    startTransition(async () => {
      setError(null)
      const result = await createMrcEvent({
        name,
        slug,
        venue: venue || null,
        contact_person: contactPerson || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        resetForm()
        onCreated()
      }
    })
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setVenue('')
    setContactPerson('')
    setContactPhone('')
    setContactEmail('')
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Plus className="size-4" />
          Buat Event Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Event MRC Baru</DialogTitle>
          <DialogDescription>
            Buat edisi baru Minangkabau Robot Contest. Event akan dimulai dalam
            status Draf.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="event-name">Nama Event *</Label>
            <Input
              id="event-name"
              placeholder="Minangkabau Robot Contest 2026"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-slug">Slug URL</Label>
            <Input
              id="event-slug"
              placeholder="mrc-2026"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Digunakan untuk URL publik. Hanya huruf kecil, angka, dan strip.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-venue">Lokasi</Label>
            <Input
              id="event-venue"
              placeholder="Politeknik Negeri Padang"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Kontak PIC</Label>
              <Input
                id="contact-name"
                placeholder="Nama PIC"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">No. Telepon</Label>
              <Input
                id="contact-phone"
                placeholder="08xxxxxxxxxx"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email PIC</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="pic@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full cursor-pointer"
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Buat Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN KECIL: Info item, Feedback, Empty
// ═════════════════════════════════════════════════════

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function FeedbackBanner({
  type,
  message,
  onDismiss,
}: {
  type: 'success' | 'error'
  message: string
  onDismiss: () => void
}) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-top-1 duration-200 ${
        type === 'error'
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      }`}
    >
      <span>{message}</span>
      <button
        type="button"
        className="text-xs underline opacity-70 hover:opacity-100 cursor-pointer"
        onClick={onDismiss}
      >
        Tutup
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <CalendarDays className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Belum ada event MRC</p>
      <p className="text-xs text-muted-foreground max-w-[280px]">
        Klik &quot;Buat Event Baru&quot; untuk membuat edisi baru Minangkabau
        Robot Contest.
      </p>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// KOMPONEN: Loading Skeleton
// ═════════════════════════════════════════════════════

export function MrcRegistrationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm"
          >
            <Skeleton className="size-3 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 rounded" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="size-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
