'use client'

/**
 * OverlayList — Menampilkan daftar URL overlay yang bisa disalin ke OBS.
 *
 * Untuk setiap overlay (match, scoreboard, bracket, standing, coming_up, break),
 * generate URL lengkap dengan query params event & cat.
 * Operator bisa klik "Copy" untuk menyalin ke clipboard.
 */

import { useState } from 'react'
import {
  Copy,
  Check,
  ExternalLink,
  Monitor,
  Filter,
  Trophy,
  Timer,
  Users,
  Swords,
  Coffee,
  CalendarClock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { getCategoriesByEvent } from '@/app/actions/mrc.action'
import type { MrcEventWithStats } from '@/app/actions/mrc.action'
import type { MrcCategory } from '@/lib/db/schema/mrc'

// ═══════════════════════════════════════════════
// DAFTAR OVERLAY
// ═══════════════════════════════════════════════

const OVERLAY_ITEMS = [
  {
    key: 'match',
    label: 'Pertandingan',
    desc: 'Nama tim + timer countdown. Overlay utama saat match.',
    icon: Swords,
    path: '/overlay/match',
    color: 'text-red-500',
  },
  {
    key: 'scoreboard',
    label: 'Papan Skor',
    desc: 'Skor detail per babak + total. Ditampilkan antar babak.',
    icon: Monitor,
    path: '/overlay/scoreboard',
    color: 'text-blue-500',
  },
  {
    key: 'bracket',
    label: 'Bracket Eliminasi',
    desc: 'Pohon bracket tahap eliminasi.',
    icon: Trophy,
    path: '/overlay/bracket',
    color: 'text-amber-500',
  },
  {
    key: 'standing',
    label: 'Klasemen Grup',
    desc: 'Tabel standing per grup. Posisi, W/D/L, poin.',
    icon: Users,
    path: '/overlay/standing',
    color: 'text-emerald-500',
  },
  {
    key: 'coming-up',
    label: 'Pertandingan Selanjutnya',
    desc: 'Preview match berikutnya + countdown opsional.',
    icon: CalendarClock,
    path: '/overlay/coming-up',
    color: 'text-violet-500',
  },
  {
    key: 'break',
    label: 'Istirahat',
    desc: 'Pesan istirahat + countdown.',
    icon: Coffee,
    path: '/overlay/break',
    color: 'text-orange-500',
  },
] as const

// ═══════════════════════════════════════════════
// KOMPONEN
// ═══════════════════════════════════════════════

interface OverlayListProps {
  events: MrcEventWithStats[]
  initialCategories: MrcCategory[]
}

export function OverlayList({ events, initialCategories }: OverlayListProps) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [categories, setCategories] = useState<MrcCategory[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategories[0]?.id ?? '')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleEventChange = async (id: string) => {
    setSelectedEventId(id)
    const result = await getCategoriesByEvent(id)
    const cats = result.data ?? []
    setCategories(cats)
    setSelectedCategoryId(cats[0]?.id ?? '')
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const getOverlayUrl = (path: string) => {
    return `${baseUrl}${path}?event=${selectedEventId}&cat=${selectedCategoryId}`
  }

  const handleCopy = async (key: string, path: string) => {
    const url = getOverlayUrl(path)
    await navigator.clipboard.writeText(url)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" /> Event
          </Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Trophy className="size-3" /> Kategori
          </Label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Pilih" /></SelectTrigger>
            <SelectContent>
              {categories.filter((c) => c.is_active).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-700 dark:text-blue-400">
        <strong>Cara pakai:</strong> Salin URL lalu tambahkan sebagai <strong>Browser Source</strong> di OBS Studio.
        Resolusi: <strong>1920×1080</strong>. Background: transparan.
      </div>

      {/* Daftar overlay */}
      <div className="grid gap-3">
        {OVERLAY_ITEMS.map((item) => {
          const Icon = item.icon
          const isCopied = copiedKey === item.key
          const url = getOverlayUrl(item.path)

          return (
            <div key={item.key} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Icon */}
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/50 ${item.color}`}>
                  <Icon className="size-4" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs cursor-pointer"
                    onClick={() => handleCopy(item.key, item.path)}
                  >
                    {isCopied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    {isCopied ? 'Disalin!' : 'Salin URL'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs cursor-pointer"
                    asChild
                  >
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* URL preview */}
              <div className="border-t bg-muted/30 px-4 py-1.5">
                <code className="text-[10px] text-muted-foreground break-all font-mono">{url}</code>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function OverlayListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Skeleton className="h-3 w-12 rounded" /><Skeleton className="h-9 w-[220px] rounded-md" /></div>
        <div className="space-y-1.5"><Skeleton className="h-3 w-16 rounded" /><Skeleton className="h-9 w-[200px] rounded-md" /></div>
      </div>
      <div className="grid gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
