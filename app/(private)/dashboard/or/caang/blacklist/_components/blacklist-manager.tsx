"use client";

/**
 * BlacklistManager — Kelola daftar blacklist caang.
 *
 * Fitur:
 * - Daftar blacklist dengan info user, alasan, status permanen/sementara
 * - Tambah blacklist baru (pilih user, alasan, bukti, permanent/temp)
 * - Hapus dari blacklist
 * - Preview bukti
 */

import { useState, useTransition } from "react";
import {
  Plus,
  Loader2,
  Ban,
  Trash2,
  ImageIcon,
  Clock,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  addToBlacklist,
  removeFromBlacklist,
  getBlacklist,
} from "@/app/actions/or.action";
import type { OrBlacklistWithUser } from "@/lib/db/schema/or";

// ═══════════════════════════════════════════════

interface Props {
  initialBlacklist: OrBlacklistWithUser[];
  members: { id: string; full_name: string; email: string }[];
}

export function BlacklistManager({ initialBlacklist, members }: Props) {
  const [isPending, startTransition] = useTransition();
  const [blacklist, setBlacklist] = useState(initialBlacklist);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form
  const [formUserId, setFormUserId] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formEvidenceUrl, setFormEvidenceUrl] = useState("");
  const [formIsPermanent, setFormIsPermanent] = useState("true");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const reload = () => {
    startTransition(async () => {
      const result = await getBlacklist();
      setBlacklist(result.data ?? []);
    });
  };

  const resetForm = () => {
    setFormUserId("");
    setFormReason("");
    setFormEvidenceUrl("");
    setFormIsPermanent("true");
    setFormExpiresAt("");
  };

  const handleAdd = () => {
    if (!formUserId || !formReason) {
      showFeedback("error", "Pilih caang dan isi alasan blacklist.");
      return;
    }
    if (formIsPermanent === "false" && !formExpiresAt) {
      showFeedback(
        "error",
        "Tanggal kedaluwarsa wajib diisi untuk blacklist sementara.",
      );
      return;
    }
    startTransition(async () => {
      const result = await addToBlacklist({
        userId: formUserId,
        reason: formReason,
        evidenceUrl: formEvidenceUrl || undefined,
        isPermanent: formIsPermanent === "true",
        expiresAt:
          formIsPermanent === "false"
            ? new Date(formExpiresAt).toISOString()
            : undefined,
      });
      if (result.error) {
        showFeedback("error", result.error);
        return;
      }
      showFeedback("success", "Caang ditambahkan ke blacklist.");
      resetForm();
      setShowForm(false);
      reload();
    });
  };

  const handleRemove = (id: string) => {
    startTransition(async () => {
      const result = await removeFromBlacklist(id);
      if (result.error) showFeedback("error", result.error);
      else showFeedback("success", "Caang dihapus dari blacklist.");
      reload();
    });
  };

  // Filter out already-blacklisted users in dropdown
  const blacklistedUserIds = new Set(blacklist.map((b) => b.user_id));
  const availableMembers = members.filter(
    (m) => !blacklistedUserIds.has(m.id),
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-2">
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">Total Blacklist</p>
          <p className="text-lg font-bold tabular-nums text-red-600">
            {blacklist.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">Permanen</p>
          <p className="text-lg font-bold tabular-nums">
            {blacklist.filter((b) => b.is_permanent).length}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">Sementara</p>
          <p className="text-lg font-bold tabular-nums">
            {blacklist.filter((b) => !b.is_permanent).length}
          </p>
        </div>
      </div>

      {/* Tombol */}
      <Button
        onClick={() => {
          setShowForm(!showForm);
          resetForm();
        }}
        className="cursor-pointer bg-red-600 hover:bg-red-700"
      >
        <Plus className="size-4" /> Tambah ke Blacklist
      </Button>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <Label className="text-sm font-semibold">Tambah Blacklist</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Caang *</Label>
              <Select value={formUserId} onValueChange={setFormUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih caang..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} — {m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Alasan *</Label>
              <Textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Alasan blacklist..."
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL Bukti (opsional)</Label>
              <Input
                value={formEvidenceUrl}
                onChange={(e) => setFormEvidenceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipe</Label>
              <Select
                value={formIsPermanent}
                onValueChange={setFormIsPermanent}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Permanen</SelectItem>
                  <SelectItem value="false">Sementara</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formIsPermanent === "false" && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <CalendarDays className="size-3" /> Kedaluwarsa *
                </Label>
                <Input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={isPending}
              className="cursor-pointer bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Blacklist
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="cursor-pointer"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Daftar */}
      {blacklist.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Tidak ada blacklist</p>
          <p className="text-xs text-muted-foreground">
            Belum ada caang yang diblacklist.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {blacklist.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border bg-card shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center text-sm font-bold text-red-600 shrink-0">
                  {(b.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{b.full_name}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${b.is_permanent ? "bg-red-500/15 text-red-600 border-red-500/25" : "bg-amber-500/15 text-amber-600 border-amber-500/25"}`}
                    >
                      {b.is_permanent ? "🔴 Permanen" : "⏰ Sementara"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{b.email}</p>
                  <p className="text-xs mt-0.5">{b.reason}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                    <span>
                      Ditambahkan:{" "}
                      {new Date(b.created_at).toLocaleDateString("id-ID")}
                    </span>
                    {!b.is_permanent && b.expires_at && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="size-2.5" /> Exp:{" "}
                        {new Date(b.expires_at).toLocaleDateString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {b.evidence_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs cursor-pointer"
                      onClick={() => setPreviewUrl(b.evidence_url)}
                    >
                      <ImageIcon className="size-3" /> Bukti
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs cursor-pointer border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        <Trash2 className="size-3" /> Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Hapus dari Blacklist?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {b.full_name} akan dihapus dari daftar blacklist.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <Button
                          onClick={() => handleRemove(b.id)}
                          disabled={isPending}
                          className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                        >
                          Hapus dari Blacklist
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Bukti blacklist"
              className="rounded-lg max-h-[80vh] object-contain"
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 bg-black/50 text-white border-white/20 cursor-pointer"
              onClick={() => setPreviewUrl(null)}
            >
              ✕ Tutup
            </Button>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
            feedback.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
