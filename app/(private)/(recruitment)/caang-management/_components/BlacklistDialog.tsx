"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface BlacklistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  reason: string;
  setReason: (val: string) => void;
  onSubmit: () => void;
  userName?: string;
  period?: string;
}

export default function BlacklistDialog({
  isOpen,
  onClose,
  loading,
  reason,
  setReason,
  onSubmit,
  userName,
  period,
}: BlacklistDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Blacklist</DialogTitle>
          <DialogDescription>
            Tindakan ini akan menonaktifkan akun peserta secara permanen untuk
            periode ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Alasan Blacklist <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Contoh: Etika buruk saat wawancara, melanggar aturan berat..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none h-24"
            />
          </div>

          {/* Review Data Singkat */}
          <div className="bg-red-50 p-3 rounded-md text-sm text-red-800 border border-red-200">
            <p>
              Peserta: <strong>{userName || "-"}</strong>
            </p>
            <p>
              Periode: <strong>{period || "-"}</strong>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Konfirmasi Blacklist"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}