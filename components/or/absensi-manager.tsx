'use client'

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import {
  Search,
  CheckCircle2,
  X,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  UserCheck,
  User,
  ScanLine,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

import {
  adminGetAttendanceList,
  adminSubmitAttendance,
  adminScanAttendanceToken,
} from '@/app/actions/or-events.action'
import {
  OrEvent,
  OrEventAttendanceWithUser,
  OR_ATTENDANCE_STATUS_LABELS,
  OrAttendanceStatus,
} from '@/lib/db/schema/or'

// ═══════════════════════════════════════════════

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  late: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
  excused: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  sick: 'bg-purple-500/15 text-purple-600 border-purple-500/25',
  absent: 'bg-red-500/15 text-red-600 border-red-500/25',
}

interface ScanHistory {
  id: string
  name: string
  status: OrAttendanceStatus
  points: number
  time: string
  success: boolean
  message?: string
}

interface Props {
  initialEvents: OrEvent[]
}

export function AbsensiManager({ initialEvents }: Props) {
  const [isPending, startTransition] = useTransition()
  const [events] = useState<OrEvent[]>(initialEvents)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [attendanceList, setAttendanceList] = useState<OrEventAttendanceWithUser[]>([])
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // UI Mode: 'list' or 'scan'
  const [viewMode, setViewMode] = useState<'list' | 'scan'>('list')
  const [scanToken, setScanToken] = useState('')
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const scanInputRef = useRef<HTMLInputElement>(null)

  // UI State
  const [selectedCaang, setSelectedCaang] = useState<OrEventAttendanceWithUser | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Form State Manual Input
  const [manualForm, setManualForm] = useState({
    status: 'present' as OrAttendanceStatus,
    notes: '',
    checked_in_at: '',
    points: 0,
  })

  // Initialize selected event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      const timer = setTimeout(() => {
        const latest = events.find((e) => e.status === 'published') || events[0]
        setSelectedEventId(latest.id)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [events, selectedEventId])

  const fetchAttendance = useCallback(async () => {
    if (!selectedEventId) return
    setIsLoading(true)
    const { data } = await adminGetAttendanceList(selectedEventId, searchText)
    if (data) setAttendanceList(data)
    setIsLoading(false)
  }, [selectedEventId, searchText])

  useEffect(() => {
    if (selectedEventId) {
      const timer = setTimeout(() => {
        fetchAttendance()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [selectedEventId, fetchAttendance])

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleScanToken = () => {
    const token = scanToken.trim()
    if (!token || !selectedEventId) return

    startTransition(async () => {
      const result = await adminScanAttendanceToken(token, selectedEventId)

      if (!result.error && result.data) {
        setScanHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              name: result.data!.fullName,
              status: result.data!.status,
              points: result.data!.points,
              time: new Date().toLocaleTimeString('id-ID'),
              success: true,
            },
            ...prev,
          ].slice(0, 10)
        )

        showFeedback(
          'success',
          `Berhasil: ${result.data.fullName} (${OR_ATTENDANCE_STATUS_LABELS[result.data.status]})`
        )
        fetchAttendance()
      } else {
        setScanHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              name: 'Unknown / Invalid',
              status: 'absent' as OrAttendanceStatus,
              points: 0,
              time: new Date().toLocaleTimeString('id-ID'),
              success: false,
              message: result.error || 'Token tidak valid',
            },
            ...prev,
          ].slice(0, 10)
        )
        showFeedback('error', result.error || 'Gagal memproses QR.')
      }

      setScanToken('')
      scanInputRef.current?.focus()
    })
  }

  const openManualInput = (caang: OrEventAttendanceWithUser) => {
    setSelectedCaang(caang)
    const currentEvent = events.find((e) => e.id === selectedEventId)

    setManualForm({
      status: caang.status || 'present',
      notes: caang.notes || '',
      checked_in_at: caang.checked_in_at || new Date().toISOString().substring(0, 16),
      points: caang.points || currentEvent?.points_present || 0,
    })
  }

  const handleSubmitManual = () => {
    if (!selectedCaang) return

    startTransition(async () => {
      const result = await adminSubmitAttendance({
        id: selectedCaang.id,
        event_id: selectedEventId,
        user_id: selectedCaang.user_id,
        ...manualForm,
        checked_in_at: new Date(manualForm.checked_in_at).toISOString(),
      })

      if (!result.error) {
        showFeedback('success', `Absensi ${selectedCaang.full_name} berhasil diperbarui.`)
        setSelectedCaang(null)
        fetchAttendance()
      } else {
        showFeedback('error', result.error || 'Gagal menyimpan absensi.')
      }
    })
  }

  const currentEvent = events.find((e) => e.id === selectedEventId)

  // Filter list on client
  const displayList = attendanceList.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
      (r.nim?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Event Selector Inline with Stats or Separate? 
          Consistent pages use a simple header. Let's place selector inside manager 
          but styled cleanly. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-dashed">
         <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pilih Aktivitas/Kegiatan</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full sm:w-[280px] h-10 border-none bg-background shadow-sm hover:ring-1 ring-primary/20 transition-all font-bold italic">
                <SelectValue placeholder="Pilih Aktivitas" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-sm">
                    {e.title} {e.status === 'published' && '🟢'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
         </div>
         
         <div className="flex items-center gap-2">
            <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('list')}
                className="font-black italic text-[10px] h-9 px-4 rounded-lg uppercase tracking-widest"
            >
                DAFTAR PESERTA
            </Button>
            <Button 
                variant={viewMode === 'scan' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('scan')}
                className="font-black italic text-[10px] h-9 px-4 rounded-lg uppercase tracking-widest"
            >
                SCANNER QR
            </Button>
         </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Stats Boxes (Consistent) */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Peserta', value: attendanceList.length, color: 'text-foreground' },
              { label: 'Hadir', value: attendanceList.filter(a => a.status === 'present').length, color: 'text-emerald-600' },
              { label: 'Telat', value: attendanceList.filter(a => a.status === 'late').length, color: 'text-orange-600' },
              { label: 'Belum', value: attendanceList.filter(a => a.status === 'absent').length, color: 'text-red-500' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card px-4 py-2 shadow-sm min-w-[100px]">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{s.label}</p>
                <p className={`text-xl font-black italic ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table Container */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
              <Search className="size-4 text-muted-foreground ml-2" />
              <Input 
                placeholder="Cari caang..." 
                className="h-9 text-xs border-none bg-muted/30 focus-visible:ring-primary/20"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button size="sm" variant="ghost" onClick={fetchAttendance} disabled={isLoading} className="size-9 p-0">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Filter className="size-4" />}
              </Button>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-widest w-12 text-muted-foreground">#</th>
                      <th className="px-3 py-3 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Peserta</th>
                      <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">NIM</th>
                      <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">Hadir</th>
                      <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">Poin</th>
                      <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                          <td colSpan={7} className="px-4 py-6 text-center"><Loader2 className="size-4 animate-spin mx-auto text-muted-foreground opacity-30" /></td>
                        </tr>
                      ))
                    ) : displayList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-20 text-center">
                          <User className="size-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-black italic text-muted-foreground">Tidak ada data peserta</p>
                        </td>
                      </tr>
                    ) : (
                      displayList.map((row, idx) => (
                        <tr key={row.user_id} className="border-b last:border-0 hover:bg-accent/30 transition-colors group">
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8 ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all">
                                <AvatarImage src={row.avatar_url || ''} />
                                <AvatarFallback className="text-[10px] font-black">{row.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-black italic text-xs tracking-tight">{row.full_name}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">{row.nickname || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-xs font-mono font-bold text-muted-foreground">{row.nim || '—'}</td>
                          <td className="px-3 py-3 text-center">
                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter h-5 px-1.5 ${ATTENDANCE_STATUS_COLORS[row.status]}`}>
                              {OR_ATTENDANCE_STATUS_LABELS[row.status]}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-center text-xs font-bold text-muted-foreground font-mono">
                            {row.checked_in_at ? new Date(row.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="text-xs font-black italic text-primary">{row.points > 0 ? `+${row.points}` : '0'}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Button size="sm" variant="ghost" className="size-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all" onClick={() => openManualInput(row)}>
                              <UserCheck className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SCANNER MODE */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="space-y-4">
              <Card className="rounded-2xl border-2 border-emerald-500/10 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10">
                         <ScanLine className="size-6 text-white" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black italic tracking-tight">Real-time Scanner</h3>
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Arahkan QR Caang ke Laser Scanner</p>
                      </div>
                   </div>

                   <div className="space-y-3 pt-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">Input Token QR (Auto-focus)</Label>
                      <div className="relative group">
                        <Input 
                            ref={scanInputRef}
                            placeholder="Tunggu scan / ketik kode..."
                            className="h-16 text-2xl font-black font-mono text-center tracking-[0.2em] border-2 border-emerald-500/20 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-2xl bg-background/50"
                            value={scanToken}
                            onChange={(e) => setScanToken(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleScanToken()}
                            autoFocus
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                           <Button className="h-10 px-4 font-black italic bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" onClick={handleScanToken} disabled={isPending || !scanToken.trim()}>
                              {isPending ? <Loader2 className="size-4 animate-spin" /> : "SCAN"}
                           </Button>
                        </div>
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground italic font-medium flex items-center justify-center gap-2">
                         <AlertCircle className="size-3" /> Input ini dioptimalkan untuk Handheld Scanner.
                      </p>
                   </div>
                </CardContent>
              </Card>

              {currentEvent && (
                <div className="grid grid-cols-2 gap-3">
                   <div className="rounded-2xl border bg-card p-4 shadow-sm border-l-4 border-l-emerald-500">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jam Mulai</p>
                      <p className="text-lg font-black italic">{currentEvent.start_time.substring(0, 5)} <span className="text-[10px] not-italic text-muted-foreground">WIB</span></p>
                   </div>
                   <div className="rounded-2xl border bg-card p-4 shadow-sm border-l-4 border-l-orange-500">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Toleransi</p>
                      <p className="text-lg font-black italic">{currentEvent.late_tolerance} <span className="text-[10px] not-italic text-muted-foreground">Menit</span></p>
                   </div>
                </div>
              )}
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="size-4 text-emerald-600" /> Riwayat Scan Terakhir
                 </h3>
                 {scanHistory.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-black italic text-muted-foreground hover:text-red-600 transition-colors" onClick={() => setScanHistory([])}>
                       <Trash2 className="size-3 mr-1.5" /> Bersihkan
                    </Button>
                 )}
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                 {scanHistory.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed rounded-3xl opacity-30 bg-muted/20">
                       <ScanLine className="size-12 mx-auto mb-4 text-muted-foreground" />
                       <p className="text-[10px] font-black uppercase tracking-widest italic">Belum ada aktivitas scan</p>
                    </div>
                 ) : (
                    scanHistory.map((item) => (
                       <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border-l-4 shadow-sm animate-in slide-in-from-right-2 duration-300 ${item.success ? 'bg-card border-l-emerald-500' : 'bg-red-500/5 border-l-red-500'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`size-10 rounded-xl flex items-center justify-center shadow-inner ${item.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                {item.success ? <CheckCircle2 className="size-5" /> : <X className="size-5" />}
                             </div>
                             <div>
                                <p className="text-sm font-black italic tracking-tight">{item.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                   {item.success && (
                                      <Badge variant="outline" className={`text-[8px] font-black h-4 px-1 leading-none ${ATTENDANCE_STATUS_COLORS[item.status]}`}>
                                         {OR_ATTENDANCE_STATUS_LABELS[item.status]}
                                      </Badge>
                                   )}
                                   <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter italic">
                                      {item.success ? `@ ${item.time}` : item.message}
                                   </span>
                                </div>
                             </div>
                          </div>
                          {item.success && (
                             <div className="text-right">
                                <p className="text-lg font-black text-emerald-600 italic tracking-tighter">+{item.points}</p>
                                <p className="text-[8px] font-black uppercase text-muted-foreground leading-none">pts</p>
                             </div>
                          )}
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Manual Input Modal */}
      {selectedCaang && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedCaang(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-primary/20" onClick={(e) => e.stopPropagation()}>
            <div className="bg-muted/50 border-b px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Input Absensi Manual</p>
                <h4 className="font-black text-sm italic">{selectedCaang.full_name}</h4>
              </div>
              <button type="button" onClick={() => setSelectedCaang(null)} className="p-2 hover:bg-accent rounded-xl transition-colors">
                <X className="size-4" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(OR_ATTENDANCE_STATUS_LABELS).map(([k, v]) => (
                  <Button
                    key={k}
                    variant={manualForm.status === k ? 'default' : 'outline'}
                    size="sm"
                    className={`h-9 text-[10px] font-black uppercase tracking-widest italic transition-all ${manualForm.status === k ? 'shadow-lg shadow-primary/20' : ''}`}
                    onClick={() => {
                        const pointsMap: Record<string, number> = {
                          present: currentEvent?.points_present || 0,
                          late: currentEvent?.points_late || 0,
                          sick: currentEvent?.points_sick || 0,
                          excused: currentEvent?.points_excused || 0,
                          absent: currentEvent?.points_absent || 0
                        };
                        setManualForm({...manualForm, status: k as OrAttendanceStatus, points: pointsMap[k]});
                    }}
                  >
                    {v}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Waktu Masuk</Label>
                  <Input 
                    type="datetime-local" 
                    className="h-10 text-[10px] font-bold bg-muted/30 border-none" 
                    value={manualForm.checked_in_at}
                    onChange={(e) => setManualForm({...manualForm, checked_in_at: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Poin Bonus/Denda</Label>
                  <Input 
                    type="number" 
                    className="h-10 text-sm font-black italic text-primary bg-muted/30 border-none" 
                    value={manualForm.points}
                    onChange={(e) => setManualForm({...manualForm, points: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-xs">Catatan (Opsional)</Label>
                <Textarea 
                  placeholder="Contoh: Terlambat karena kendala teknis..."
                  className="min-h-[100px] text-xs font-semibold bg-muted/30 border-none resize-none rounded-xl"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({...manualForm, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 h-12 text-xs font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 rounded-xl" onClick={handleSubmitManual} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                  SIMPAN DATA
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback */}
      {feedback && (
        <div className={`fixed bottom-8 right-8 z-50 rounded-2xl border-2 px-6 py-4 text-sm shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-10 flex items-center gap-4 ${
          feedback.type === 'error'
            ? 'border-red-500/30 bg-red-600 text-white'
            : 'border-emerald-500/30 bg-emerald-600 text-white'
        }`}>
          <div className="size-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
             {feedback.type === 'success' ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
          </div>
          <p className="font-black italic tracking-wide uppercase text-xs">{feedback.msg}</p>
        </div>
      )}
    </div>
  )
}

export function AbsensiSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}
