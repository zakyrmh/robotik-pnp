'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Users,
  Search,
  Download,
  Filter,
  Loader2,
  TrendingUp,
  Award,
  Zap,
  Calendar,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { adminGetAttendanceSummary } from '@/app/actions/or-events.action'

// ═══════════════════════════════════════════════

interface RekapData {
  user_id: string
  full_name: string
  nim: string | null
  total_points: number
  present_count: number
  late_count: number
  absent_count: number
  total_events: number
}

interface Props {
  initialSummary: RekapData[]
}

export function RekapitulasiManager({ initialSummary }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<RekapData[]>(initialSummary)
  const [searchText, setSearchText] = useState('')

  const fetchSummary = useCallback(async () => {
    setIsLoading(true)
    const { data } = await adminGetAttendanceSummary()
    if (data) setSummary(data)
    setIsLoading(false)
  }, [])

  const filteredData = summary.filter(item => 
    item.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.nim?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
  )

  const totalPointsAll = summary.reduce((acc, curr) => acc + curr.total_points, 0)
  const avgPoints = summary.length > 0 ? (totalPointsAll / summary.length).toFixed(1) : '0'
  const topScorer = summary[0]?.full_name || '-'

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Summary Pattern (Consistent with Database/Blacklist boxes) */}
      <div className="flex flex-wrap gap-2">
        <div className="rounded-xl border bg-card px-4 py-2 shadow-sm min-w-[120px] bg-amber-500/5 border-amber-500/10">
          <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-1">
             <Award className="size-3" /> Top Scorer
          </p>
          <p className="text-sm font-black italic truncate max-w-[150px]">{topScorer}</p>
        </div>
        
        <div className="rounded-xl border bg-card px-4 py-2 shadow-sm min-w-[100px]">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
             <TrendingUp className="size-3" /> Rerata Poin
          </p>
          <p className="text-lg font-black italic tracking-tighter">{avgPoints} <span className="text-[10px] not-italic text-muted-foreground uppercase">pts</span></p>
        </div>

        <div className="rounded-xl border bg-card px-4 py-2 shadow-sm min-w-[100px]">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
             <Users className="size-3" /> Total Caang
          </p>
          <p className="text-lg font-black italic tracking-tighter">{summary.length}</p>
        </div>

        <div className="rounded-xl border bg-card px-4 py-2 shadow-sm min-w-[100px]">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
             <Zap className="size-3" /> Total Poin
          </p>
          <p className="text-lg font-black italic tracking-tighter text-primary">{totalPointsAll}</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
           <Search className="size-4 text-muted-foreground ml-2" />
           <Input 
             placeholder="Cari caang..." 
             className="h-9 text-xs border-none bg-muted/30 focus-visible:ring-amber-500/20"
             value={searchText}
             onChange={(e) => setSearchText(e.target.value)}
           />
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchSummary} disabled={isLoading} className="h-9 font-bold text-[10px] uppercase tracking-widest italic outline-none">
            {isLoading ? <Loader2 className="size-3 animate-spin mr-2" /> : <Filter className="size-3 mr-2" />}
            Refresh
          </Button>
          <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black italic text-[10px] uppercase tracking-widest">
            <Download className="size-3.5 mr-2" /> EXPORT CSV
          </Button>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-widest w-12 text-muted-foreground italic">Rank</th>
                <th className="px-3 py-3 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground italic">Nama Lengkap</th>
                <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground italic">NIM</th>
                <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground italic">Hadir</th>
                <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground italic">Telat</th>
                <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground italic">Event</th>
                <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-amber-600 italic">Total Poin</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={7} className="px-4 py-8 text-center"><Loader2 className="size-5 animate-spin mx-auto text-muted-foreground opacity-30" /></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-24 text-center">
                    <Trophy className="size-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-black italic text-muted-foreground uppercase tracking-widest">Belum ada data pendaftar</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.user_id} className="border-b last:border-0 hover:bg-accent/30 transition-colors group">
                    <td className="px-4 py-4">
                       <div className={`size-7 rounded-lg flex items-center justify-center text-[10px] font-black italic shadow-sm transition-transform group-hover:scale-110 ${
                          idx === 0 ? 'bg-amber-500 text-white shadow-amber-500/20' : 
                          idx === 1 ? 'bg-zinc-300 text-zinc-700' : 
                          idx === 2 ? 'bg-orange-300 text-orange-800' : 
                          'bg-muted text-muted-foreground'
                       }`}>
                         {idx + 1}
                       </div>
                    </td>
                    <td className="px-3 py-4">
                       <p className="font-black italic text-sm tracking-tight">{row.full_name}</p>
                    </td>
                    <td className="px-3 py-4 text-center text-[10px] font-mono font-bold text-muted-foreground">{row.nim || '—'}</td>
                    <td className="px-3 py-4 text-center">
                       <Badge variant="outline" className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 border-emerald-500/20 h-5 px-2 leading-none uppercase tracking-tighter">
                         {row.present_count}
                       </Badge>
                    </td>
                    <td className="px-3 py-4 text-center">
                       <Badge variant="outline" className="text-[9px] font-black bg-orange-500/10 text-orange-600 border-orange-500/20 h-5 px-2 leading-none uppercase tracking-tighter">
                         {row.late_count}
                       </Badge>
                    </td>
                    <td className="px-3 py-4 text-center">
                       <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                         <Calendar className="size-3 text-primary/40" /> {row.total_events}
                       </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                       <div className="flex items-center justify-center gap-1">
                          <p className="text-base font-black italic text-amber-600 tracking-tighter">
                            {row.total_points}
                          </p>
                          <span className="text-[8px] font-black uppercase text-muted-foreground mt-1 tracking-widest">pts</span>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function RekapitulasiSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  )
}
