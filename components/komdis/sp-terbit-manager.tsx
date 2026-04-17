'use client'

/**
 * SpTerbitManager — Buat & terbitkan Surat Peringatan Digital.
 *
 * Fitur:
 * - Form buat SP: pilih anggota, level (SP-1/2/3), perihal, alasan, ringkasan pelanggaran, konsekuensi
 * - Otomatis ambil poin anggota terkini saat membuat SP
 * - Daftar SP draft yang siap diterbitkan
 * - Terbitkan SP (draft → issued) + generate nomor surat otomatis
 * - Cabut SP aktif (issued → revoked) dengan alasan
 * - Edit & hapus SP draft
 */

import { useState, useTransition } from 'react'
import {
  Plus,
  Loader2,
  FileText,
  Send,
  Edit3,
  Trash2,
  Ban,
  CheckCircle2,
  CalendarDays,
  Zap,
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
  createWarningLetter,
  updateWarningLetter,
  issueWarningLetter,
  revokeWarningLetter,
  deleteWarningLetter,
  getWarningLetters,
} from '@/app/actions/komdis.action'
import type {
  KomdisWarningLetterWithUser,
  KomdisMemberPointSummary,
  KomdisSpLevel,
  KomdisSpStatus,
} from '@/lib/db/schema/komdis'
import {
  KOMDIS_SP_LEVEL_LABELS,
  KOMDIS_SP_LEVEL_SHORT,
  KOMDIS_SP_STATUS_LABELS,
} from '@/lib/db/schema/komdis'

// ═══════════════════════════════════════════════

const LEVEL_COLORS: Record<KomdisSpLevel, string> = {
  sp1: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  sp2: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
  sp3: 'bg-red-500/15 text-red-600 border-red-500/25',
}

const STATUS_COLORS: Record<KomdisSpStatus, string> = {
  draft: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25',
  issued: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  acknowledged: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  revoked: 'bg-rose-500/15 text-rose-500 border-rose-500/25',
}

interface Props {
  initialLetters: KomdisWarningLetterWithUser[]
  members: { id: string; full_name: string; email: string }[]
  pointSummaries: KomdisMemberPointSummary[]
}

interface FormState {
  userId: string
  level: KomdisSpLevel
  subject: string
  reason: string
  violationsSummary: string
  consequences: string
  effectiveDate: string
  expiryDate: string
}

const emptyForm: FormState = {
  userId: '', level: 'sp1', subject: '', reason: '',
  violationsSummary: '', consequences: '', effectiveDate: '', expiryDate: '',
}

export function SpTerbitManager({ initialLetters, members, pointSummaries }: Props) {
  const [isPending, startTransition] = useTransition()
  const [letters, setLetters] = useState(initialLetters)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [revokeReason, setRevokeReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const pointMap = new Map(pointSummaries.map((s) => [s.user_id, s.net_points]))

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reload = () => {
    startTransition(async () => {
      const result = await getWarningLetters()
      setLetters(result.data ?? [])
    })
  }

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => { setForm(emptyForm); setEditId(null) }

  const openEdit = (sp: KomdisWarningLetterWithUser) => {
    setEditId(sp.id)
    setForm({
      userId: sp.user_id,
      level: sp.level,
      subject: sp.subject,
      reason: sp.reason,
      violationsSummary: sp.violations_summary ?? '',
      consequences: sp.consequences ?? '',
      effectiveDate: sp.effective_date ?? '',
      expiryDate: sp.expiry_date ?? '',
    })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.userId || !form.subject || !form.reason) {
      showFeedback('error', 'Pilih anggota, perihal, dan alasan wajib diisi.')
      return
    }
    startTransition(async () => {
      if (editId) {
        const result = await updateWarningLetter(editId, {
          level: form.level,
          subject: form.subject,
          reason: form.reason,
          violations_summary: form.violationsSummary || null,
          consequences: form.consequences || null,
          effective_date: form.effectiveDate || null,
          expiry_date: form.expiryDate || null,
        })
        if (result.error) { showFeedback('error', result.error); return }
        showFeedback('success', 'SP berhasil diperbarui!')
      } else {
        const result = await createWarningLetter({
          userId: form.userId,
          level: form.level,
          subject: form.subject,
          reason: form.reason,
          violationsSummary: form.violationsSummary || undefined,
          consequences: form.consequences || undefined,
          effectiveDate: form.effectiveDate || undefined,
          expiryDate: form.expiryDate || undefined,
          pointsAtIssue: pointMap.get(form.userId) ?? 0,
        })
        if (result.error) { showFeedback('error', result.error); return }
        showFeedback('success', 'Draft SP berhasil dibuat!')
      }
      resetForm()
      setShowForm(false)
      reload()
    })
  }

  const handleIssue = (id: string) => {
    startTransition(async () => {
      const result = await issueWarningLetter(id)
      if (result.error) showFeedback('error', result.error)
      else showFeedback('success', 'SP berhasil diterbitkan!')
      reload()
    })
  }

  const handleRevoke = (id: string) => {
    if (!revokeReason.trim()) { showFeedback('error', 'Alasan pencabutan wajib diisi.'); return }
    startTransition(async () => {
      const result = await revokeWarningLetter({ id, reason: revokeReason })
      if (result.error) showFeedback('error', result.error)
      else showFeedback('success', 'SP berhasil dicabut.')
      setRevokeReason('')
      reload()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteWarningLetter(id)
      if (result.error) showFeedback('error', result.error)
      else showFeedback('success', 'Draft SP dihapus.')
      reload()
    })
  }

  // Stats
  const draftCount = letters.filter((l) => l.status === 'draft').length
  const activeCount = letters.filter((l) => l.status === 'issued' || l.status === 'acknowledged').length

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">Draft</p>
          <p className="text-lg font-bold tabular-nums">{draftCount}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">Aktif</p>
          <p className="text-lg font-bold tabular-nums text-blue-600">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">Total SP</p>
          <p className="text-lg font-bold tabular-nums">{letters.length}</p>
        </div>
      </div>

      {/* Tombol buat */}
      <Button
        onClick={() => { setShowForm(!showForm); resetForm() }}
        className="cursor-pointer bg-rose-600 hover:bg-rose-700"
      >
        <Plus className="size-4" /> Buat Surat Peringatan
      </Button>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <Label className="text-sm font-semibold">{editId ? 'Edit' : 'Buat'} Surat Peringatan</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {!editId && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Anggota *</Label>
                <Select value={form.userId} onValueChange={(v) => setField('userId', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih anggota..." /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => {
                      const pts = pointMap.get(m.id)
                      return (
                        <SelectItem key={m.id} value={m.id}>
                          {m.full_name} — {m.email}
                          {pts != null && pts > 0 ? ` (${pts} poin)` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {form.userId && pointMap.has(form.userId) && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <Zap className="size-3" /> Poin anggota saat ini: {pointMap.get(form.userId)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Level SP *</Label>
              <Select value={form.level} onValueChange={(v) => setField('level', v as KomdisSpLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KOMDIS_SP_LEVEL_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Perihal *</Label>
              <Input value={form.subject} onChange={(e) => setField('subject', e.target.value)} placeholder="Pelanggaran Disiplin" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Alasan / Dasar Penerbitan *</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setField('reason', e.target.value)}
                placeholder="Berdasarkan akumulasi poin pelanggaran yang telah mencapai batas..."
                className="min-h-[70px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Ringkasan Pelanggaran</Label>
              <Textarea
                value={form.violationsSummary}
                onChange={(e) => setField('violationsSummary', e.target.value)}
                placeholder="1. Tidak hadir di Mubes (2 poin)&#10;2. Terlambat Rapat Evaluasi (1 poin)&#10;..."
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Konsekuensi / Tindakan Lanjutan</Label>
              <Textarea
                value={form.consequences}
                onChange={(e) => setField('consequences', e.target.value)}
                placeholder="Apabila pelanggaran terulang, akan ditingkatkan ke SP-2..."
                className="min-h-[50px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><CalendarDays className="size-3" /> Tanggal Berlaku</Label>
              <Input type="date" value={form.effectiveDate} onChange={(e) => setField('effectiveDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><CalendarDays className="size-3" /> Tanggal Kedaluwarsa</Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => setField('expiryDate', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending} className="cursor-pointer">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {editId ? 'Simpan Perubahan' : 'Simpan Draft'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); resetForm() }} className="cursor-pointer">Batal</Button>
          </div>
        </div>
      )}

      {/* Daftar SP */}
      {letters.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Belum ada Surat Peringatan</p>
          <p className="text-xs text-muted-foreground">Buat SP pertama untuk anggota yang perlu ditegur.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {letters.map((sp) => (
            <div key={sp.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-start gap-4 px-4 py-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${LEVEL_COLORS[sp.level]}`}>
                  {KOMDIS_SP_LEVEL_SHORT[sp.level]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{sp.subject}</p>
                    <Badge variant="outline" className={`text-[10px] ${LEVEL_COLORS[sp.level]}`}>
                      {KOMDIS_SP_LEVEL_SHORT[sp.level]}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[sp.status]}`}>
                      {KOMDIS_SP_STATUS_LABELS[sp.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">{sp.full_name}</span>
                    {' — '}{sp.letter_number}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                    {sp.issued_date && <span>Terbit: {sp.issued_date}</span>}
                    {sp.effective_date && <span>Berlaku: {sp.effective_date}</span>}
                    {sp.expiry_date && <span>Exp: {sp.expiry_date}</span>}
                    <span className="flex items-center gap-0.5"><Zap className="size-2.5" /> {sp.points_at_issue} poin</span>
                  </div>
                </div>

                {/* Aksi */}
                <div className="flex gap-1.5 shrink-0 flex-wrap">
                  {sp.status === 'draft' && (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="text-xs cursor-pointer bg-blue-600 hover:bg-blue-700">
                            <Send className="size-3" /> Terbitkan
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Terbitkan SP?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {KOMDIS_SP_LEVEL_SHORT[sp.level]} untuk {sp.full_name} akan diterbitkan secara resmi.
                              SP yang sudah diterbitkan tidak bisa diedit.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <Button onClick={() => handleIssue(sp.id)} disabled={isPending} className="cursor-pointer bg-blue-600 hover:bg-blue-700">
                              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Terbitkan
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => openEdit(sp)}>
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
                            <AlertDialogTitle>Hapus Draft SP?</AlertDialogTitle>
                            <AlertDialogDescription>Draft SP untuk {sp.full_name} akan dihapus permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <Button variant="destructive" onClick={() => handleDelete(sp.id)} disabled={isPending} className="cursor-pointer">Hapus</Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {(sp.status === 'issued' || sp.status === 'acknowledged') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs cursor-pointer border-rose-500/30 text-rose-600 hover:bg-rose-500/10">
                          <Ban className="size-3" /> Cabut SP
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cabut Surat Peringatan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {KOMDIS_SP_LEVEL_SHORT[sp.level]} untuk {sp.full_name} akan dicabut/dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="px-6 space-y-2">
                          <Label className="text-xs">Alasan Pencabutan *</Label>
                          <Textarea
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            placeholder="Alasan mengapa SP dicabut..."
                            className="min-h-[60px]"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setRevokeReason('')}>Batal</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={() => handleRevoke(sp.id)}
                            disabled={isPending || !revokeReason.trim()}
                            className="cursor-pointer"
                          >
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />} Cabut SP
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Detail surat */}
              <div className="px-4 pb-3 space-y-1.5 border-t pt-2">
                <div className="text-xs">
                  <span className="text-muted-foreground">Alasan:</span>{' '}
                  <span>{sp.reason}</span>
                </div>
                {sp.violations_summary && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Pelanggaran:</span>
                    <pre className="mt-0.5 whitespace-pre-wrap text-[11px] bg-muted/30 p-2 rounded-md font-sans">{sp.violations_summary}</pre>
                  </div>
                )}
                {sp.consequences && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Konsekuensi:</span>{' '}
                    <span className="italic">{sp.consequences}</span>
                  </div>
                )}
                {sp.status === 'revoked' && sp.revoke_reason && (
                  <div className="text-xs text-rose-600 border-l-2 border-rose-400 pl-2 mt-1">
                    <span className="font-medium">Alasan Pencabutan:</span> {sp.revoke_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
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

export function SpTerbitSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-24 rounded-lg" />)}
      </div>
      <Skeleton className="h-9 w-52 rounded-md" />
      {[1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
    </div>
  )
}
