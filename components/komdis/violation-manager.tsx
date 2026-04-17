'use client'

/**
 * ViolationManager — Input, edit, hapus pelanggaran & poin.
 *
 * Fitur:
 * - Ringkasan poin per anggota (tabel ranking)
 * - Form input pelanggaran baru (pilih anggota, kategori, deskripsi, poin)
 * - Daftar semua pelanggaran dengan filter kategori
 * - Edit pelanggaran (kategori, deskripsi, poin)
 * - Hapus pelanggaran
 */

import { useState, useTransition } from 'react'
import {
  Plus,
  Loader2,
  Filter,
  Edit3,
  Trash2,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  createViolation,
  updateViolation,
  deleteViolation,
  getViolations,
  getMemberPointSummaries,
} from '@/app/actions/komdis.action'
import type {
  KomdisViolationWithUser,
  KomdisMemberPointSummary,
  KomdisViolationCategory,
} from '@/lib/db/schema/komdis'
import { KOMDIS_VIOLATION_CATEGORY_LABELS } from '@/lib/db/schema/komdis'

// ═══════════════════════════════════════════════

const CATEGORY_COLORS: Record<KomdisViolationCategory, string> = {
  attendance: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  discipline: 'bg-red-500/15 text-red-600 border-red-500/25',
  property: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
  ethics: 'bg-rose-500/15 text-rose-600 border-rose-500/25',
  other: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25',
}

interface Props {
  initialViolations: KomdisViolationWithUser[]
  initialSummaries: KomdisMemberPointSummary[]
  members: { id: string; full_name: string; email: string }[]
}

export function ViolationManager({ initialViolations, initialSummaries, members }: Props) {
  const [isPending, startTransition] = useTransition()
  const [violations, setViolations] = useState(initialViolations)
  const [summaries, setSummaries] = useState(initialSummaries)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchMember, setSearchMember] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Form state
  const [formUserId, setFormUserId] = useState('')
  const [formCategory, setFormCategory] = useState<KomdisViolationCategory>('discipline')
  const [formDescription, setFormDescription] = useState('')
  const [formPoints, setFormPoints] = useState('1')

  // View mode
  const [viewMode, setViewMode] = useState<'summary' | 'violations'>('summary')

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reload = () => {
    startTransition(async () => {
      const [vRes, sRes] = await Promise.all([
        getViolations(
          filterCategory !== 'all' ? { category: filterCategory as KomdisViolationCategory } : undefined
        ),
        getMemberPointSummaries(),
      ])
      setViolations(vRes.data ?? [])
      setSummaries(sRes.data ?? [])
    })
  }

  const resetForm = () => {
    setFormUserId('')
    setFormCategory('discipline')
    setFormDescription('')
    setFormPoints('1')
    setEditId(null)
  }

  const handleCreate = () => {
    if (!formUserId || !formDescription) {
      showFeedback('error', 'Pilih anggota dan isi deskripsi pelanggaran.')
      return
    }
    startTransition(async () => {
      const result = await createViolation({
        userId: formUserId,
        category: formCategory,
        description: formDescription,
        points: parseInt(formPoints) || 1,
      })
      if (result.error) { showFeedback('error', result.error); return }
      showFeedback('success', 'Pelanggaran berhasil dicatat!')
      resetForm()
      setShowForm(false)
      reload()
    })
  }

  const openEdit = (v: KomdisViolationWithUser) => {
    setEditId(v.id)
    setFormUserId(v.user_id)
    setFormCategory(v.category)
    setFormDescription(v.description)
    setFormPoints(String(v.points))
    setShowForm(true)
    setViewMode('violations')
  }

  const handleUpdate = () => {
    if (!editId) return
    startTransition(async () => {
      const result = await updateViolation(editId, {
        category: formCategory,
        description: formDescription,
        points: parseInt(formPoints) || 1,
      })
      if (result.error) { showFeedback('error', result.error); return }
      showFeedback('success', 'Pelanggaran berhasil diperbarui!')
      resetForm()
      setShowForm(false)
      reload()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteViolation(id)
      if (result.error) showFeedback('error', result.error)
      else showFeedback('success', 'Pelanggaran dihapus.')
      reload()
    })
  }

  const handleFilter = () => {
    startTransition(async () => {
      const filters: { category?: KomdisViolationCategory } = {}
      if (filterCategory !== 'all') filters.category = filterCategory as KomdisViolationCategory
      const result = await getViolations(filters)
      setViolations(result.data ?? [])
    })
  }

  // Filter summaries by search
  const filteredSummaries = summaries.filter((s) =>
    !searchMember || s.full_name.toLowerCase().includes(searchMember.toLowerCase()) || s.email.toLowerCase().includes(searchMember.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Tombol aksi & mode switch */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => { setShowForm(!showForm); resetForm() }}
          className="cursor-pointer bg-red-600 hover:bg-red-700"
        >
          <Plus className="size-4" /> Input Pelanggaran
        </Button>
        <div className="flex rounded-lg border bg-muted/30 p-0.5 ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('summary')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${viewMode === 'summary' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
          >
            <Trophy className="size-3 inline mr-1" /> Ringkasan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('violations')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${viewMode === 'violations' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
          >
            <AlertTriangle className="size-3 inline mr-1" /> Semua Pelanggaran
          </button>
        </div>
      </div>

      {/* Form input */}
      {showForm && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <Label className="text-sm font-semibold">{editId ? 'Edit' : 'Input'} Pelanggaran</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {!editId && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Anggota *</Label>
                <Select value={formUserId} onValueChange={setFormUserId}>
                  <SelectTrigger><SelectValue placeholder="Pilih anggota..." /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} — {m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Kategori</Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as KomdisViolationCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KOMDIS_VIOLATION_CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Poin</Label>
              <Input type="number" min={0} value={formPoints} onChange={(e) => setFormPoints(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Deskripsi Pelanggaran *</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Deskripsi pelanggaran..."
                className="min-h-[60px]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={editId ? handleUpdate : handleCreate} disabled={isPending} className="cursor-pointer">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {editId ? 'Simpan Perubahan' : 'Catat Pelanggaran'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); resetForm() }} className="cursor-pointer">Batal</Button>
          </div>
        </div>
      )}

      {/* TAB 1: Ringkasan poin per anggota */}
      {viewMode === 'summary' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Cari anggota..."
              className="max-w-[260px] h-8 text-xs"
            />
          </div>

          {filteredSummaries.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
              <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Tidak ada data poin</p>
              <p className="text-xs text-muted-foreground">Belum ada pelanggaran yang dicatat.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-medium text-xs w-8">#</th>
                    <th className="px-3 py-2.5 text-left font-medium text-xs">Anggota</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Pelanggaran</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Total Poin</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Pengurangan</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Poin Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.map((s, i) => (
                    <tr key={s.user_id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(s.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{s.full_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">{s.total_violations}</td>
                      <td className="px-3 py-2.5 text-center text-xs font-medium text-red-600">{s.total_points}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-emerald-600">
                        {s.total_reductions > 0 ? `-${s.total_reductions}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant="outline" className={`text-[10px] ${
                          s.net_points >= 5 ? 'bg-red-500/15 text-red-600 border-red-500/25'
                            : s.net_points >= 3 ? 'bg-amber-500/15 text-amber-600 border-amber-500/25'
                              : 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25'
                        }`}>
                          {s.net_points} poin
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Semua pelanggaran */}
      {viewMode === 'violations' && (
        <div className="space-y-3">
          {/* Filter */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Kategori</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {Object.entries(KOMDIS_VIOLATION_CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleFilter} disabled={isPending} className="cursor-pointer">
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <Filter className="size-3" />}
              Filter
            </Button>
          </div>

          {violations.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
              <AlertTriangle className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Belum ada pelanggaran</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-medium text-xs">Anggota</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Kategori</th>
                    <th className="px-3 py-2.5 text-left font-medium text-xs">Deskripsi</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Poin</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Tanggal</th>
                    <th className="px-3 py-2.5 text-center font-medium text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v) => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(v.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-xs truncate max-w-[120px]">{v.full_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[v.category]}`}>
                          {KOMDIS_VIOLATION_CATEGORY_LABELS[v.category]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[200px]">
                        {v.description}
                        {v.event_title && (
                          <span className="block text-[10px] italic mt-0.5">📅 {v.event_title}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs font-bold text-red-600">{v.points}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 cursor-pointer"
                            onClick={() => openEdit(v)}
                          >
                            <Edit3 className="size-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="size-7 p-0 text-red-500 cursor-pointer hover:text-red-600">
                                <Trash2 className="size-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pelanggaran?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Pelanggaran &quot;{v.description.slice(0, 50)}...&quot; untuk {v.full_name} akan dihapus.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <Button variant="destructive" onClick={() => handleDelete(v.id)} disabled={isPending} className="cursor-pointer">Hapus</Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

export function ViolationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-9 w-52 rounded-lg ml-auto" />
      </div>
      <Skeleton className="h-8 w-[260px] rounded-md" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
