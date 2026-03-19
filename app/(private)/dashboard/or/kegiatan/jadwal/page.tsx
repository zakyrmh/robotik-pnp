"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Edit3,
  Trash2,
  CalendarDays,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  adminGetEvents,
  adminSaveEvent,
  adminDeleteEvent,
} from "@/app/actions/or-events.action";
import {
  OrEvent,
  OR_EVENT_TYPE_LABELS,
  OR_EVENT_MODE_LABELS,
  OR_EVENT_STATUS_LABELS,
  OrEventType,
  OrEventMode,
  OrEventStatus,
} from "@/lib/db/schema/or";

export default function JadwalKegiatanPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<OrEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<OrEvent> | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Form State
  const initialForm: Partial<OrEvent> = {
    title: "",
    description: "",
    event_type: "lainnya",
    event_date: new Date().toISOString().split("T")[0],
    start_time: "08:00",
    end_time: "12:00",
    execution_mode: "offline",
    location: "",
    meeting_link: "",
    status: "draft",
    allow_attendance: true,
    late_tolerance: 15,
    points_present: 10,
    points_late: 5,
    points_excused: 2,
    points_sick: 2,
    points_absent: 0,
  };

  const [formData, setFormData] = useState<Partial<OrEvent>>(initialForm);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    const { data } = await adminGetEvents();
    if (data) setEvents(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (event: OrEvent) => {
    setEditingEvent(event);
    setFormData(event);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const { success, error } = await adminSaveEvent(formData);
      if (success) {
        showFeedback("success", editingEvent ? "Kegiatan berhasil diperbarui." : "Kegiatan berhasil dibuat.");
        setIsDialogOpen(false);
        fetchEvents();
      } else {
        showFeedback("error", error || "Gagal menyimpan kegiatan.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) return;
    
    const { success, error } = await adminDeleteEvent(id);
    if (success) {
      showFeedback("success", "Kegiatan berhasil dihapus.");
      fetchEvents();
    } else {
      showFeedback("error", error || "Gagal menghapus kegiatan.");
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Pattern Consistent with DatabasePage */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Jadwal Kegiatan</h1>
            <p className="text-sm text-muted-foreground">
              Atur agenda kegiatan Open Recruitment dan konfigurasi absensi.
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAdd} size="sm">
          <Plus className="mr-2 size-4" />
          Tambah Kegiatan
        </Button>
      </div>

      {/* Filter & Search Section */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Cari kegiatan..."
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Section */}
      {filteredEvents.length === 0 ? (
        <Card className="rounded-xl border border-dashed py-12 text-center">
          <Calendar className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada data kegiatan</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="rounded-xl border shadow-sm flex flex-col transition-all hover:ring-1 hover:ring-primary/20">
              <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <Badge variant="outline" className={`text-[10px] ${
                    event.status === 'published' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25' : 
                    event.status === 'completed' ? 'bg-blue-500/15 text-blue-600 border-blue-500/25' : 
                    'bg-zinc-500/15 text-zinc-500 border-zinc-500/25'
                  }`}>
                    {OR_EVENT_STATUS_LABELS[event.status]}
                  </Badge>
                  <CardTitle className="text-base font-bold line-clamp-1">{event.title}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(event)} className="cursor-pointer">
                      <Edit3 className="mr-2 size-3" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-destructive focus:text-destructive cursor-pointer">
                      <Trash2 className="mr-2 size-3" /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 flex-1 text-sm">
                <div className="flex flex-col gap-2 text-muted-foreground text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3 text-primary" />
                    {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-3 text-primary" />
                    {event.start_time.substring(0, 5)} - {event.end_time?.substring(0, 5) || 'Selesai'}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3 text-primary" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {event.execution_mode !== 'offline' && event.meeting_link && (
                    <div className="flex items-center gap-2">
                      <Link2 className="size-3 text-primary" />
                      <span className="truncate text-blue-600">{event.meeting_link}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t flex items-center justify-between text-[10px] uppercase font-bold tracking-tight">
                  <div className="flex items-center gap-1.5">
                    {event.allow_attendance ? (
                      <span className="text-emerald-600">Absensi Aktif</span>
                    ) : (
                      <span className="text-muted-foreground">Tanpa Absensi</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">{OR_EVENT_TYPE_LABELS[event.event_type]}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CRUD Dialog - Consistent with app-sidebar/database styles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Kegiatan" : "Buat Kegiatan Baru"}</DialogTitle>
            <DialogDescription className="text-xs font-medium">Isi detail kegiatan untuk informasikan ke caang.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Judul Aktivitas</Label>
                <Input
                  className="h-9 text-xs" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pelatihan Robotik"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs">Tipe Kegiatan</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(val) => setFormData({ ...formData, event_type: val as OrEventType })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OR_EVENT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as OrEventStatus })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OR_EVENT_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Deskripsi</Label>
                <Textarea
                  className="min-h-[80px] text-xs"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opsional..."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 border-t pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal</Label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mulai</Label>
                <Input
                  type="time"
                  className="h-9 text-xs"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Selesai</Label>
                <Input
                  type="time"
                  className="h-9 text-xs"
                  value={formData.end_time || ""}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
               <div className="space-y-1.5">
                <Label className="text-xs">Mode</Label>
                <Select
                  value={formData.execution_mode}
                  onValueChange={(val) => setFormData({ ...formData, execution_mode: val as OrEventMode })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OR_EVENT_MODE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.execution_mode !== 'online' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Lokasi</Label>
                  <Input
                    className="h-9 text-xs"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Tempat kegiatan..."
                  />
                </div>
              )}
              {formData.execution_mode !== 'offline' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-blue-600">Meeting Link</Label>
                  <Input
                    className="h-9 text-xs"
                    value={formData.meeting_link || ""}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="Zoom / Meet link..."
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">Aktifkan Absensi</Label>
                  <p className="text-[10px] text-muted-foreground">Catat kehadiran caang dan perolehan poin.</p>
                </div>
                <Switch 
                  checked={formData.allow_attendance}
                  onCheckedChange={(val) => setFormData({...formData, allow_attendance: val})}
                />
              </div>

              {formData.allow_attendance && (
                <div className="grid gap-4 sm:grid-cols-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Toleransi (Menit)</Label>
                    <Input type="number" className="h-8 text-xs" value={formData.late_tolerance} onChange={(e) => setFormData({...formData, late_tolerance: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Poin Hadir</Label>
                    <Input type="number" className="h-8 text-xs" value={formData.points_present} onChange={(e) => setFormData({...formData, points_present: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Poin Telat</Label>
                    <Input type="number" className="h-8 text-xs" value={formData.points_late} onChange={(e) => setFormData({...formData, points_late: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 border-t pt-4 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} disabled={isPending}>Batal</Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3 animate-spin" />}
              {editingEvent ? "Simpan Perubahan" : "Buat Kegiatan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Message */}
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm animate-in fade-in-0 flex items-center gap-2 ${
          feedback.type === 'error'
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
