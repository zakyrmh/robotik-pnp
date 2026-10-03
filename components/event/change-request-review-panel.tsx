"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reviewRegistrationChangeRequestAction } from "@/lib/actions/event-admin";
import { ChangeRequestDiff } from "@/components/event/change-request-diff";
import type {
  EventRegistration,
  RegistrationChangeRequest,
} from "@/types/event-registration";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilePenLine, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  registration: EventRegistration;
  changeRequests: RegistrationChangeRequest[];
}

const STATUS_STYLE: Record<string, string> = {
  pending: "border-warning/30 bg-warning-soft text-warning",
  approved: "border-success/30 bg-success-soft text-success",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Tinjauan",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export function ChangeRequestReviewPanel({
  registration,
  changeRequests,
}: Props) {
  const pending = changeRequests.filter((r) => r.status === "pending");
  const latestPending = pending[0];

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    if (!latestPending) return;
    startTransition(async () => {
      const res = await reviewRegistrationChangeRequestAction({
        request_id: latestPending.id,
        action: "approve",
      });
      if (!res.success) {
        toast.error(res.error || "Gagal menyetujui permohonan.");
        return;
      }
      toast.success(res.message || "Perubahan data diterapkan.");
      setShowApprove(false);
    });
  };

  const handleReject = () => {
    if (!latestPending) return;
    if (!rejectNote.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await reviewRegistrationChangeRequestAction({
        request_id: latestPending.id,
        action: "reject",
        note: rejectNote.trim(),
      });
      if (!res.success) {
        toast.error(res.error || "Gagal menolak permohonan.");
        return;
      }
      toast.success(res.message || "Permohonan ditolak.");
      setShowReject(false);
      setRejectNote("");
    });
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="flex items-center gap-2 font-display text-md font-bold text-foreground">
          <FilePenLine className="size-5 text-primary" aria-hidden="true" />
          Permohonan Perbaikan Data
        </h2>
        {changeRequests[0] && (
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-micro",
              STATUS_STYLE[changeRequests[0].status],
            )}
          >
            {STATUS_LABEL[changeRequests[0].status]}
          </Badge>
        )}
      </div>

      {!latestPending ? (
        <p className="text-xs text-muted-foreground">
          Tidak ada permohonan perbaikan data yang menunggu tinjauan untuk tim
          ini.
        </p>
      ) : (
        <>
          <ChangeRequestDiff request={latestPending} current={registration} />

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowApprove(true)}
              disabled={isPending}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-success px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-success/90 disabled:opacity-50"
            >
              <Check className="size-4" aria-hidden="true" />
              Setujui &amp; Terapkan
            </button>
            <button
              type="button"
              onClick={() => setShowReject(true)}
              disabled={isPending}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
              Tolak
            </button>
          </div>
        </>
      )}

      {/* Dialog Setujui */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              Setujui Perbaikan Data
            </DialogTitle>
            <DialogDescription>
              Perubahan akan langsung diterapkan ke data pendaftaran tim ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowApprove(false)}
              disabled={isPending}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-success px-4 py-2 text-xs font-semibold text-white hover:bg-success/90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
              Terapkan Perubahan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tolak */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              Tolak Permohonan
            </DialogTitle>
            <DialogDescription>
              Berikan alasan agar peserta memahami keputusan panitia.
            </DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Contoh: Nama anggota tidak sesuai dokumen / foto tidak jelas..."
            className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              disabled={isPending}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending || !rejectNote.trim()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <X className="size-4" aria-hidden="true" />
              )}
              Konfirmasi Tolak
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
