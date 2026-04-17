"use client";

/**
 * AbsensiManager — Scan QR / Input Absensi kegiatan OR.
 *
 * Fitur:
 * - Pilih kegiatan aktif
 * - Mode Daftar: tabel peserta + status + manual input
 * - Mode Scanner: scan QR token + riwayat scan
 * - Input manual absensi (modal)
 */

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import {
  adminGetAttendanceList,
  adminSubmitAttendance,
  adminScanAttendanceToken,
} from "@/app/actions/or-events.action";
import type {
  OrEvent,
  OrEventAttendanceWithUser,
  OrAttendanceStatus,
} from "@/lib/db/schema/or";
import { OR_ATTENDANCE_STATUS_LABELS } from "@/lib/db/schema/or";

// ═══════════════════════════════════════════════

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
  late: "bg-orange-500/15 text-orange-600 border-orange-500/25",
  excused: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  sick: "bg-purple-500/15 text-purple-600 border-purple-500/25",
  absent: "bg-red-500/15 text-red-600 border-red-500/25",
};

interface ScanHistory {
  id: string;
  name: string;
  status: OrAttendanceStatus;
  points: number;
  time: string;
  success: boolean;
  message?: string;
}

interface Props {
  initialEvents: OrEvent[];
}

export function AbsensiManager({ initialEvents }: Props) {
  const [isPending, startTransition] = useTransition();
  const [events] = useState<OrEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [attendanceList, setAttendanceList] = useState<
    OrEventAttendanceWithUser[]
  >([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // UI Mode
  const [viewMode, setViewMode] = useState<"list" | "scan">("list");
  const [scanToken, setScanToken] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [selectedCaang, setSelectedCaang] =
    useState<OrEventAttendanceWithUser | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Form State Manual Input
  const [manualForm, setManualForm] = useState({
    status: "present" as OrAttendanceStatus,
    notes: "",
    checked_in_at: "",
    points: 0,
  });

  // Initialize selected event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      const timer = setTimeout(() => {
        const latest =
          events.find((e) => e.status === "published") || events[0];
        setSelectedEventId(latest.id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [events, selectedEventId]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedEventId) return;
    setIsLoading(true);
    const { data } = await adminGetAttendanceList(selectedEventId, searchText);
    if (data) setAttendanceList(data);
    setIsLoading(false);
  }, [selectedEventId, searchText]);

  useEffect(() => {
    if (selectedEventId) {
      const timer = setTimeout(() => {
        fetchAttendance();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedEventId, fetchAttendance]);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleScanToken = () => {
    const token = scanToken.trim();
    if (!token || !selectedEventId) return;

    startTransition(async () => {
      const result = await adminScanAttendanceToken(token, selectedEventId);

      if (!result.error && result.data) {
        setScanHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              name: result.data!.fullName,
              status: result.data!.status,
              points: result.data!.points,
              time: new Date().toLocaleTimeString("id-ID"),
              success: true,
            },
            ...prev,
          ].slice(0, 10),
        );
        showFeedback(
          "success",
          `Berhasil: ${result.data.fullName} (${OR_ATTENDANCE_STATUS_LABELS[result.data.status]})`,
        );
        fetchAttendance();
      } else {
        setScanHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              name: "Unknown / Invalid",
              status: "absent" as OrAttendanceStatus,
              points: 0,
              time: new Date().toLocaleTimeString("id-ID"),
              success: false,
              message: result.error || "Token tidak valid",
            },
            ...prev,
          ].slice(0, 10),
        );
        showFeedback("error", result.error || "Gagal memproses QR.");
      }

      setScanToken("");
      scanInputRef.current?.focus();
    });
  };

  const openManualInput = (caang: OrEventAttendanceWithUser) => {
    setSelectedCaang(caang);
    const currentEvent = events.find((e) => e.id === selectedEventId);

    setManualForm({
      status: caang.status || "present",
      notes: caang.notes || "",
      checked_in_at:
        caang.checked_in_at ||
        new Date().toISOString().substring(0, 16),
      points: caang.points || currentEvent?.points_present || 0,
    });
  };

  const handleSubmitManual = () => {
    if (!selectedCaang) return;

    startTransition(async () => {
      const result = await adminSubmitAttendance({
        id: selectedCaang.id || undefined,
        event_id: selectedEventId,
        user_id: selectedCaang.user_id,
        ...manualForm,
        checked_in_at: new Date(manualForm.checked_in_at).toISOString(),
      });

      if (!result.error) {
        showFeedback(
          "success",
          `Absensi ${selectedCaang.full_name} berhasil diperbarui.`,
        );
        setSelectedCaang(null);
        fetchAttendance();
      } else {
        showFeedback("error", result.error || "Gagal menyimpan absensi.");
      }
    });
  };

  const currentEvent = events.find((e) => e.id === selectedEventId);

  // Filter list on client
  const displayList = attendanceList.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
      (r.nim?.toLowerCase().includes(searchText.toLowerCase()) ?? false),
  );

  return (
    <div className="space-y-4">
      {/* Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/10 p-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">
            Pilih Kegiatan
          </Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full sm:w-[280px] h-9 text-xs">
              <SelectValue placeholder="Pilih kegiatan..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-xs">
                  {e.title} {e.status === "published" && "🟢"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="cursor-pointer text-xs h-9"
          >
            Daftar Peserta
          </Button>
          <Button
            variant={viewMode === "scan" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("scan")}
            className="cursor-pointer text-xs h-9"
          >
            <ScanLine className="size-3 mr-1.5" /> Scanner QR
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "Peserta",
                value: attendanceList.length,
                color: "text-foreground",
              },
              {
                label: "Hadir",
                value: attendanceList.filter((a) => a.status === "present")
                  .length,
                color: "text-emerald-600",
              },
              {
                label: "Telat",
                value: attendanceList.filter((a) => a.status === "late").length,
                color: "text-orange-600",
              },
              {
                label: "Belum",
                value: attendanceList.filter((a) => a.status === "absent")
                  .length,
                color: "text-red-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border bg-card px-3 py-2 shadow-sm"
              >
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold tabular-nums ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="size-4 text-muted-foreground" />
            <Input
              placeholder="Cari caang..."
              className="h-9 text-xs"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchAttendance}
              disabled={isLoading}
              className="size-9 p-0 cursor-pointer"
            >
              <Filter className="size-4" />
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-xs w-10">
                    #
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-xs">
                    Peserta
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs">
                    NIM
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs">
                    Hadir
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs">
                    Poin
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-2.5">
                        <Skeleton className="h-4 w-4" />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-7 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-2.5 w-14" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Skeleton className="h-3 w-16 mx-auto" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Skeleton className="h-5 w-14 rounded-full mx-auto" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Skeleton className="h-3 w-10 mx-auto" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Skeleton className="h-3 w-8 mx-auto" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Skeleton className="size-7 rounded-md mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : displayList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <User className="size-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        Tidak ada data peserta
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayList.map((row, idx) => (
                    <tr
                      key={row.user_id}
                      className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7">
                            <AvatarImage src={row.avatar_url || ""} />
                            <AvatarFallback className="text-[10px] font-bold">
                              {row.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {row.full_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {row.nickname || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-mono text-muted-foreground">
                        {row.nim || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${ATTENDANCE_STATUS_COLORS[row.status]}`}
                        >
                          {OR_ATTENDANCE_STATUS_LABELS[row.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-muted-foreground font-mono">
                        {row.checked_in_at
                          ? new Date(row.checked_in_at).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs font-bold text-primary">
                          {row.points > 0 ? `+${row.points}` : "0"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 cursor-pointer"
                          onClick={() => openManualInput(row)}
                        >
                          <UserCheck className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SCANNER MODE */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {/* Scanner Card */}
            <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ScanLine className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Real-time Scanner</p>
                  <p className="text-[10px] text-muted-foreground">
                    Arahkan QR Caang ke Laser Scanner
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-emerald-600">
                  Input Token QR
                </Label>
                <div className="relative">
                  <Input
                    ref={scanInputRef}
                    placeholder="Tunggu scan / ketik kode..."
                    className="h-12 text-lg font-mono text-center pr-20"
                    value={scanToken}
                    onChange={(e) => setScanToken(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScanToken()}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Button
                      size="sm"
                      className="h-8 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleScanToken}
                      disabled={isPending || !scanToken.trim()}
                    >
                      {isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        "SCAN"
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="size-3" /> Dioptimalkan untuk Handheld
                  Scanner.
                </p>
              </div>
            </div>

            {/* Event info cards */}
            {currentEvent && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
                  <p className="text-[10px] text-muted-foreground">
                    Jam Mulai
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {currentEvent.start_time.substring(0, 5)}{" "}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      WIB
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
                  <p className="text-[10px] text-muted-foreground">
                    Toleransi
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {currentEvent.late_tolerance}{" "}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Menit
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scan history */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3" /> Riwayat Scan Terakhir
              </p>
              {scanHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] text-muted-foreground cursor-pointer"
                  onClick={() => setScanHistory([])}
                >
                  <Trash2 className="size-3 mr-1" /> Bersihkan
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {scanHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card p-12 text-center shadow-sm">
                  <ScanLine className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Belum ada aktivitas scan</p>
                </div>
              ) : (
                scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm animate-in slide-in-from-right-2 ${
                      !item.success ? "border-red-500/25" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center ${
                          item.success
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {item.success ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <X className="size-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.success && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] h-4 px-1 ${ATTENDANCE_STATUS_COLORS[item.status]}`}
                            >
                              {OR_ATTENDANCE_STATUS_LABELS[item.status]}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {item.success ? `@ ${item.time}` : item.message}
                          </span>
                        </div>
                      </div>
                    </div>
                    {item.success && (
                      <span className="text-sm font-bold text-emerald-600">
                        +{item.points}
                      </span>
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
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelectedCaang(null)}
        >
          <div
            className="bg-card rounded-xl shadow-lg w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Input Absensi Manual
                </p>
                <p className="text-sm font-semibold">
                  {selectedCaang.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaang(null)}
                className="cursor-pointer p-1 hover:bg-accent rounded"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(OR_ATTENDANCE_STATUS_LABELS).map(([k, v]) => (
                  <Button
                    key={k}
                    variant={manualForm.status === k ? "default" : "outline"}
                    size="sm"
                    className="h-9 text-xs cursor-pointer"
                    onClick={() => {
                      const pointsMap: Record<string, number> = {
                        present: currentEvent?.points_present || 0,
                        late: currentEvent?.points_late || 0,
                        sick: currentEvent?.points_sick || 0,
                        excused: currentEvent?.points_excused || 0,
                        absent: currentEvent?.points_absent || 0,
                      };
                      setManualForm({
                        ...manualForm,
                        status: k as OrAttendanceStatus,
                        points: pointsMap[k],
                      });
                    }}
                  >
                    {v}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Waktu Masuk</Label>
                  <Input
                    type="datetime-local"
                    className="h-9 text-xs"
                    value={manualForm.checked_in_at}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        checked_in_at: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Poin</Label>
                  <Input
                    type="number"
                    className="h-9 text-xs"
                    value={manualForm.points}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Catatan (Opsional)</Label>
                <Textarea
                  placeholder="Contoh: Terlambat karena kendala teknis..."
                  className="min-h-[80px] text-xs"
                  value={manualForm.notes}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 border-t pt-3">
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={handleSubmitManual}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Simpan Absensi
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCaang(null)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 flex items-center gap-2 ${
            feedback.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
