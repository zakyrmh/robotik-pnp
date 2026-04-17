'use client'

/**
 * KegiatanManager — Buat & kelola kegiatan resmi UKM.
 *
 * Fitur:
 * - Form buat kegiatan: judul, tanggal, jam mulai/selesai, lokasi, toleransi telat, poin
 * - Daftar kegiatan dengan status badge
 * - Ubah status: draft → upcoming → ongoing → completed
 * - Edit & hapus kegiatan
 */

import { useState, useTransition } from 'react'
import {
  Plus,
  Loader2,
  CalendarDays,
  Clock,
  MapPin,
  Edit3,
  Trash2,
  Play,
  Square,
  Send,
  CheckCircle2,
  AlertTriangle,
  Timer,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import {
  createKomdisEvent,
  updateKomdisEvent,
  updateKomdisEventStatus,
  deleteKomdisEvent,
  getKomdisEvents,
} from '@/app/actions/komdis.action'
import type { KomdisEvent, KomdisEventStatus } from '@/lib/db/schema/komdis'
import { KOMDIS_EVENT_STATUS_LABELS } from '@/lib/db/schema/komdis'

// ═══════════════════════════════════════════════

const STATUS_COLORS: Record<KomdisEventStatus, string> = {
  draft: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/25',
  upcoming: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  ongoing: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  completed: 'bg-purple-500/15 text-purple-600 border-purple-500/25',
}

const STATUS_TRANSITIONS: Record<KomdisEventStatus, { next: KomdisEventStatus; label: string; icon: typeof Play }[]> = {
  draft: [{ next: 'upcoming', label: 'Publikasikan', icon: Send }],
  upcoming: [{ next: 'ongoing', label: 'Mulai Absensi', icon: Play }],
  ongoing: [{ next: 'completed', label: 'Selesai', icon: Square }],
  completed: [],
}

interface Props {
  initialEvents: KomdisEvent[]
}

interface FormState {
  title: string
  description: string
  location: string
  event_date: string
  start_time: string
  end_time: string
  late_tolerance: string
  points_per_late: string
}

const emptyForm: FormState = {
  title: '', description: '', location: '', event_date: '',
  start_time: '', end_time: '', late_tolerance: '0', points_per_late: '1',
}

export function KegiatanManager({ initialEvents }: Props) {
  const [isPending, startTransition] = useTransition()
  const [events, setEvents] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reload = () => {
    startTransition(async () => {
      const result = await getKomdisEvents()
      setEvents(result.data ?? [])
    })
  }

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const openEdit = (ev: KomdisEvent) => {
    setEditId(ev.id)
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      location: ev.location ?? '',
      event_date: ev.event_date,
      start_time: ev.start_time,
      end_time: ev.end_time ?? '',
      late_tolerance: String(ev.late_tolerance),
      points_per_late: String(ev.points_per_late),
    })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.title || !form.event_date || !form.start_time) {
      showFeedback('error', 'Judul, tanggal, dan jam mulai wajib diisi.')
      return
    }
    startTransition(async () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        eventDate: form.event_date,
        startTime: form.start_time,
        endTime: form.end_time || undefined,
        lateTolerance: parseInt(form.late_tolerance) || 0,
        pointsPerLate: parseInt(form.points_per_late) || 1,
      }

      if (editId) {
        const result = await updateKomdisEvent(editId, payload)
        if (result.error) { showFeedback('error', result.error); return }
        showFeedback('success', 'Kegiatan berhasil diperbarui!')
      } else {
        const result = await createKomdisEvent(payload)
        if (result.error) { showFeedback('error', result.error); return }
        showFeedback('success', 'Kegiatan berhasil dibuat!')
      }
      setShowForm(false)
      setEditId(null)
      setForm(emptyForm)
      reload()
    })
  }

  const handleStatusChange = (id: string, status: KomdisEventStatus) => {
    startTransition(async () => {
      const result = await updateKomdisEventStatus(id, status)
      if (result.error) showFeedback('error', result.error)
      else showFeedback('success', `Status diubah ke "${KOMDIS_EVENT_STATUS_LABELS[status]}"`)
      reload()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteKomdisEvent(id)
      if (result.error) showFeedback('error', result.error)
      else showFeedback('success', 'Kegiatan dihapus.')
      reload()
    })
  }

  return (
    <div className="space-y-4">
      {/* Tombol Buat */}
      <Button
        onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm) }}
        className="cursor-pointer bg-purple-600 hover:bg-purple-700"
      >
        <Plus className="size-4" />
        Buat Kegiatan Baru
      </Button>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <Label className="text-sm font-semibold">{editId ? 'Edit' : 'Buat'} Kegiatan</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Judul Kegiatan *</Label>
              <Input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Musyawarah Besar 2026" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Deskripsi kegiatan..." className="min-h-[60px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><MapPin className="size-3" /> Lokasi</Label>
              <Input value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Aula PNP" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><CalendarDays className="size-3" /> Tanggal *</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setField('event_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Clock className="size-3" /> Jam Mulai *</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Clock className="size-3" /> Jam Selesai</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setField('end_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Timer className="size-3" /> Toleransi Telat (menit)</Label>
              <Input type="number" min={0} value={form.late_tolerance} onChange={(e) => setField('late_tolerance', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><AlertTriangle className="size-3" /> Poin Default (telat)</Label>
              <Input type="number" min={0} value={form.points_per_late} onChange={(e) => setField('points_per_late', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending} className="cursor-pointer">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {editId ? 'Simpan Perubahan' : 'Buat Kegiatan'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditId(null) }} className="cursor-pointer">Batal</Button>
          </div>
        </div>
      )}

      {/* Daftar Kegiatan */}
      {events.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <CalendarDays className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Belum ada kegiatan</p>
          <p className="text-xs text-muted-foreground">Buat kegiatan resmi UKM pertama.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {events.map((ev) => {
            const transitions = STATUS_TRANSITIONS[ev.status]
            return (
              <div key={ev.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Icon */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <CalendarDays className="size-5 text-purple-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{ev.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[ev.status]}`}>
                        {KOMDIS_EVENT_STATUS_LABELS[ev.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {ev.event_date}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {ev.start_time}{ev.end_time ? ` — ${ev.end_time}` : ''}</span>
                      {ev.location && <span className="flex items-center gap-1"><MapPin className="size-3" /> {ev.location}</span>}
                      <span className="flex items-center gap-1"><Timer className="size-3" /> Toleransi: {ev.late_tolerance} mnt</span>
                    </div>
                  </div>

                  {/* Aksi */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {transitions.map((t) => {
                      const Icon = t.icon
                      return (
                        <AlertDialog key={t.next}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="text-xs cursor-pointer">
                              <Icon className="size-3" /> {t.label}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.label}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Status kegiatan &quot;{ev.title}&quot; akan diubah ke &quot;{KOMDIS_EVENT_STATUS_LABELS[t.next]}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <Button onClick={() => handleStatusChange(ev.id, t.next)} disabled={isPending} className="cursor-pointer">
                                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                                {t.label}
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )
                    })}
                    {ev.status === 'draft' && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => openEdit(ev)}>
                          <Edit3 className="size-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-xs cursor-pointer border-red-500/30 text-red-600 hover:bg-red-500/10">
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Kegiatan?</AlertDialogTitle>
                              <AlertDialogDescription>Kegiatan &quot;{ev.title}&quot; akan dihapus permanen.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <Button variant="destructive" onClick={() => handleDelete(ev.id)} disabled={isPending} className="cursor-pointer">Hapus</Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>

                {ev.description && (
                  <div className="px-4 pb-3 text-xs text-muted-foreground border-t pt-2">
                    {ev.description}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
          feedback.type === 'error'
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        }`}>{feedback.msg}</div>
      )}
    </div>
  )
}

export function KegiatanSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-44 rounded-md" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  )
}
