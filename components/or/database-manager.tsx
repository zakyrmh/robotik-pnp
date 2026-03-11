'use client'

/**
 * DatabaseManager — Database & Edit Data pendaftar.
 *
 * Fitur:
 * - Tabel lengkap semua pendaftar
 * - Statistik per status
 * - Filter: status, search (nama/email/NIM)
 * - Edit biodata pendaftar (modal)
 * - Edit profil (nama, telepon, alamat, dll)
 * - Preview dokumen
 */

import { useState, useTransition } from 'react'
import {
  Filter,
  Loader2,
  Edit3,
  Search,
  X,
  Phone,
  MapPin,
  GraduationCap,
  CheckCircle2,
  Image,
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
  getRegistrations,
  adminUpdateRegistration,
  adminUpdateProfile,
} from '@/app/actions/or.action'
import type { OrRegistrationWithUser, OrRegistrationStatus } from '@/lib/db/schema/or'
import { OR_REGISTRATION_STATUS_LABELS } from '@/lib/db/schema/or'

// ═══════════════════════════════════════════════

const STATUS_COLORS: Record<OrRegistrationStatus, string> = {
  draft: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25',
  submitted: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  revision: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
  accepted: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-600 border-red-500/25',
  training: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  interview_1: "bg-purple-500/15 text-purple-600 border-purple-500/25",
  project_phase: "bg-indigo-500/15 text-indigo-600 border-indigo-500/25",
  interview_2: "bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/25",
  graduated: "bg-emerald-600/20 text-emerald-700 border-emerald-600/30 font-bold",
}

interface Props {
  initialRegistrations: OrRegistrationWithUser[]
}

export function DatabaseManager({ initialRegistrations }: Props) {
  const [isPending, startTransition] = useTransition()
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [editReg, setEditReg] = useState<OrRegistrationWithUser | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Edit form
  const [editFullName, setEditFullName] = useState('')
  const [editNickname, setEditNickname] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editMotivation, setEditMotivation] = useState('')
  const [editOrgExp, setEditOrgExp] = useState('')
  const [editAchievements, setEditAchievements] = useState('')
  const [editYearEnrolled, setEditYearEnrolled] = useState('')

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reload = () => {
    startTransition(async () => {
      const filters: { status?: OrRegistrationStatus; search?: string } = {}
      if (filterStatus !== 'all') filters.status = filterStatus as OrRegistrationStatus
      if (searchText) filters.search = searchText
      const result = await getRegistrations(filters)
      setRegistrations(result.data ?? [])
    })
  }

  const openEdit = (r: OrRegistrationWithUser) => {
    setEditReg(r)
    setEditFullName(r.full_name)
    setEditNickname(r.nickname ?? '')
    setEditPhone(r.phone ?? '')
    setEditAddress(r.address_domicile ?? '')
    setEditMotivation(r.motivation ?? '')
    setEditOrgExp(r.org_experience ?? '')
    setEditAchievements(r.achievements ?? '')
    setEditYearEnrolled(r.year_enrolled ? String(r.year_enrolled) : '')
  }

  const handleSave = () => {
    if (!editReg) return
    startTransition(async () => {
      // Update profile
      const profileRes = await adminUpdateProfile(editReg.user_id, {
        full_name: editFullName,
        nickname: editNickname || undefined,
        phone: editPhone || undefined,
        address_domicile: editAddress || undefined,
      })
      if (profileRes.error) { showFeedback('error', profileRes.error); return }

      // Update registration data
      const regRes = await adminUpdateRegistration(editReg.id, {
        motivation: editMotivation || null,
        org_experience: editOrgExp || null,
        achievements: editAchievements || null,
        year_enrolled: editYearEnrolled ? parseInt(editYearEnrolled) : null,
      })
      if (regRes.error) { showFeedback('error', regRes.error); return }

      showFeedback('success', `Data ${editFullName} berhasil diperbarui!`)
      setEditReg(null)
      reload()
    })
  }

  // Stats
  const stats = {
    total: registrations.length,
    draft: registrations.filter((r) => r.status === 'draft').length,
    submitted: registrations.filter((r) => r.status === 'submitted').length,
    revision: registrations.filter((r) => r.status === 'revision').length,
    accepted: registrations.filter((r) => r.status === 'accepted').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  }

  // Display
  const displayList = searchText
    ? registrations.filter((r) => {
        const q = searchText.toLowerCase()
        return r.full_name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                (r.nim?.toLowerCase().includes(q) ?? false)
      })
    : registrations

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Draft', value: stats.draft, color: 'text-zinc-500' },
          { label: 'Menunggu', value: stats.submitted, color: 'text-amber-600' },
          { label: 'Revisi', value: stats.revision, color: 'text-orange-600' },
          { label: 'Diterima', value: stats.accepted, color: 'text-emerald-600' },
          { label: 'Ditolak', value: stats.rejected, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 shadow-sm text-center">
            <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {Object.entries(OR_REGISTRATION_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Cari nama / email / NIM..."
            className="w-[240px] h-9 text-xs"
          />
        </div>
        <Button size="sm" onClick={() => reload()} disabled={isPending} className="cursor-pointer">
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Filter className="size-3" />}
          Filter
        </Button>
      </div>

      {/* Tabel */}
      {displayList.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <GraduationCap className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Tidak ada data</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-xs">#</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Nama</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">NIM</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Prodi</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Telepon</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Step</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Terdaftar</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((r, i) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                        {(r.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{r.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[r.status]}`}>
                      {OR_REGISTRATION_STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono">{r.nim ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs truncate max-w-[120px]">{r.study_program_name ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center text-xs">{r.phone ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className="text-[10px] bg-sky-500/15 text-sky-600 border-sky-500/25">
                      {r.current_step === 'completed' ? '✅' : r.current_step === 'payment' ? '💳' : r.current_step === 'documents' ? '📄' : '📝'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="ghost" className="size-7 p-0 cursor-pointer" onClick={() => openEdit(r)}>
                        <Edit3 className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editReg && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditReg(null)}>
          <div className="bg-card rounded-xl shadow-lg w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b px-5 py-3 flex items-center justify-between z-10">
              <p className="font-semibold">Edit Data — {editReg.full_name}</p>
              <button type="button" onClick={() => setEditReg(null)} className="cursor-pointer p-1 hover:bg-accent rounded"><X className="size-4" /></button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Lengkap</Label>
                  <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Panggilan</Label>
                  <Input value={editNickname} onChange={(e) => setEditNickname(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Phone className="size-3" /> No HP</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tahun Masuk</Label>
                  <Input type="number" value={editYearEnrolled} onChange={(e) => setEditYearEnrolled(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs flex items-center gap-1"><MapPin className="size-3" /> Alamat Domisili</Label>
                  <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Motivasi</Label>
                  <Textarea value={editMotivation} onChange={(e) => setEditMotivation(e.target.value)} className="min-h-[60px]" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Pengalaman Organisasi</Label>
                  <Textarea value={editOrgExp} onChange={(e) => setEditOrgExp(e.target.value)} className="min-h-[50px]" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Prestasi</Label>
                  <Textarea value={editAchievements} onChange={(e) => setEditAchievements(e.target.value)} className="min-h-[50px]" />
                </div>
              </div>

              {/* Document links (read-only view) */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Dokumen (klik untuk preview)</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Foto', url: editReg.photo_url },
                    { label: 'KTM', url: editReg.ktm_url },
                    { label: 'IG Robotik', url: editReg.ig_follow_url },
                    { label: 'IG MRC', url: editReg.ig_mrc_url },
                    { label: 'YT', url: editReg.yt_sub_url },
                    { label: 'Bukti Bayar', url: editReg.payment_url },
                  ].map((doc) => (
                    <button
                      key={doc.label}
                      type="button"
                      disabled={!doc.url}
                      onClick={() => doc.url && setPreviewUrl(doc.url)}
                      className={`cursor-pointer text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 ${
                        doc.url ? 'hover:bg-accent text-blue-600' : 'text-muted-foreground opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Image className="size-3" /> {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-3">
                <Button onClick={handleSave} disabled={isPending} className="cursor-pointer">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Simpan Perubahan
                </Button>
                <Button variant="ghost" onClick={() => setEditReg(null)} className="cursor-pointer">Batal</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center cursor-pointer" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[80vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview dokumen" className="rounded-lg max-h-[80vh] object-contain" />
            <Button size="sm" variant="outline" className="absolute top-2 right-2 bg-black/50 text-white border-white/20 cursor-pointer" onClick={() => setPreviewUrl(null)}>✕ Tutup</Button>
          </div>
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

export function DatabaseSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-[240px] rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
