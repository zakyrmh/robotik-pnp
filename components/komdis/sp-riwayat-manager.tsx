'use client'

/**
 * SpRiwayatManager — Riwayat lengkap SP seluruh anggota.
 *
 * Fitur:
 * - Filter: level (SP-1/2/3), status (draft/issued/acknowledged/revoked), anggota
 * - Statistik: jumlah SP per level + total aktif
 * - Tabel riwayat: anggota, level, status, nomor surat, tanggal, poin saat terbit
 * - Detail SP expandable: alasan, pelanggaran, konsekuensi, pencabutan
 * - Search anggota
 */

import { useState, useTransition } from 'react'
import {
  Filter,
  Loader2,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  CalendarDays,
  AlertTriangle,
  Ban,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { getWarningLetters } from '@/app/actions/komdis.action'
import type {
  KomdisWarningLetterWithUser,
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
}

export function SpRiwayatManager({ initialLetters, members }: Props) {
  const [isPending, startTransition] = useTransition()
  const [letters, setLetters] = useState(initialLetters)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleFilter = () => {
    startTransition(async () => {
      const filters: { level?: KomdisSpLevel; status?: KomdisSpStatus; userId?: string } = {}
      if (filterLevel !== 'all') filters.level = filterLevel as KomdisSpLevel
      if (filterStatus !== 'all') filters.status = filterStatus as KomdisSpStatus
      if (filterUser !== 'all') filters.userId = filterUser
      const result = await getWarningLetters(filters)
      setLetters(result.data ?? [])
    })
  }

  // Client-side search on top of server filters
  const displayList = searchText
    ? letters.filter((l) =>
        l.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
        l.letter_number.toLowerCase().includes(searchText.toLowerCase()) ||
        l.subject.toLowerCase().includes(searchText.toLowerCase())
      )
    : letters

  // Stats
  const countSp1 = letters.filter((l) => l.level === 'sp1' && l.status !== 'revoked').length
  const countSp2 = letters.filter((l) => l.level === 'sp2' && l.status !== 'revoked').length
  const countSp3 = letters.filter((l) => l.level === 'sp3' && l.status !== 'revoked').length
  const countActive = letters.filter((l) => l.status === 'issued' || l.status === 'acknowledged').length
  const countRevoked = letters.filter((l) => l.status === 'revoked').length

  return (
    <div className="space-y-4">
      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'SP-1', value: countSp1, color: 'text-amber-600 bg-amber-500/10' },
          { label: 'SP-2', value: countSp2, color: 'text-orange-600 bg-orange-500/10' },
          { label: 'SP-3', value: countSp3, color: 'text-red-600 bg-red-500/10' },
          { label: 'Aktif', value: countActive, color: 'text-blue-600 bg-blue-500/10' },
          { label: 'Dicabut', value: countRevoked, color: 'text-rose-500 bg-rose-500/10' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 shadow-sm">
            <div className={`flex size-7 items-center justify-center rounded-md ${s.color} mb-1`}>
              {s.label.startsWith('SP') ? <FileText className="size-3.5" /> : s.label === 'Dicabut' ? <Ban className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
            </div>
            <p className="text-xl font-bold tabular-nums">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Level</Label>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="sp1">SP-1</SelectItem>
              <SelectItem value="sp2">SP-2</SelectItem>
              <SelectItem value="sp3">SP-3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(KOMDIS_SP_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Anggota</Label>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Anggota</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleFilter} disabled={isPending} className="cursor-pointer">
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Filter className="size-3" />}
          Filter
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Cari nama, nomor surat, perihal..."
          className="max-w-[300px] h-8 text-xs"
        />
      </div>

      {/* Tabel riwayat */}
      {displayList.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Tidak ada riwayat SP</p>
          <p className="text-xs text-muted-foreground">Belum ada Surat Peringatan yang diterbitkan.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-xs">Anggota</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Level</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">No. Surat</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Perihal</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Tanggal</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">Poin</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((sp) => {
                const isExpanded = expandedId === sp.id
                return (
                  <tr key={sp.id} className="group">
                    {/* Main row */}
                    <td className="px-4 py-2.5 border-b group-last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(sp.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs truncate">{sp.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{sp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center border-b group-last:border-0">
                      <Badge variant="outline" className={`text-[10px] ${LEVEL_COLORS[sp.level]}`}>
                        {KOMDIS_SP_LEVEL_SHORT[sp.level]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center border-b group-last:border-0">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[sp.status]}`}>
                        {KOMDIS_SP_STATUS_LABELS[sp.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground border-b group-last:border-0">
                      {sp.letter_number}
                    </td>
                    <td className="px-3 py-2.5 text-xs border-b group-last:border-0 truncate max-w-[150px]">
                      {sp.subject}
                    </td>
                    <td className="px-3 py-2.5 text-center text-[10px] text-muted-foreground border-b group-last:border-0">
                      {sp.issued_date ?? sp.created_at.split('T')[0]}
                    </td>
                    <td className="px-3 py-2.5 text-center border-b group-last:border-0">
                      <span className="text-xs font-medium flex items-center justify-center gap-0.5">
                        <Zap className="size-2.5 text-amber-500" /> {sp.points_at_issue}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center border-b group-last:border-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : sp.id)}
                        className="cursor-pointer p-1 hover:bg-accent rounded transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                    </td>

                    {/* Expanded detail — rendered as separate cells won't work in table, use a trick */}
                    {isExpanded && (
                      <td colSpan={8} className="px-4 py-3 bg-muted/20 border-b text-xs space-y-1.5 animate-in slide-in-from-top-1">
                        <div>
                          <span className="text-muted-foreground">Alasan:</span>{' '}{sp.reason}
                        </div>
                        {sp.violations_summary && (
                          <div>
                            <span className="text-muted-foreground">Pelanggaran:</span>
                            <pre className="mt-0.5 whitespace-pre-wrap text-[11px] bg-background p-2 rounded-md font-sans border">{sp.violations_summary}</pre>
                          </div>
                        )}
                        {sp.consequences && (
                          <div>
                            <span className="text-muted-foreground">Konsekuensi:</span>{' '}
                            <span className="italic">{sp.consequences}</span>
                          </div>
                        )}
                        <div className="flex gap-4 text-[10px] text-muted-foreground flex-wrap">
                          {sp.effective_date && <span className="flex items-center gap-1"><CalendarDays className="size-2.5" /> Berlaku: {sp.effective_date}</span>}
                          {sp.expiry_date && <span className="flex items-center gap-1"><CalendarDays className="size-2.5" /> Kedaluwarsa: {sp.expiry_date}</span>}
                          {sp.acknowledged_at && <span>Dibaca: {new Date(sp.acknowledged_at).toLocaleDateString('id-ID')}</span>}
                        </div>
                        {sp.status === 'revoked' && sp.revoke_reason && (
                          <div className="text-rose-600 border-l-2 border-rose-400 pl-2">
                            <span className="font-medium">Dicabut:</span> {sp.revoke_reason}
                            {sp.revoked_at && <span className="text-[10px] ml-2 opacity-70">({new Date(sp.revoked_at).toLocaleDateString('id-ID')})</span>}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function SpRiwayatSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <div className="flex gap-3">
        {[150, 160, 200, 64].map((w, i) => <Skeleton key={i} className="h-9 rounded-md" style={{ width: w }} />)}
      </div>
      <Skeleton className="h-8 w-[300px] rounded-md" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
