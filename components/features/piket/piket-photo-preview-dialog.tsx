"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PiketPhotoPreviewDialog({
  open,
  beforeUrl,
  afterUrl,
  reporterName,
  dutyDate,
  activeTab,
  onTabChange,
  onClose,
}: {
  open: boolean;
  beforeUrl: string | null;
  afterUrl: string | null;
  reporterName: string;
  dutyDate: string;
  activeTab: "before" | "after";
  onTabChange: (tab: "before" | "after") => void;
  onClose: () => void;
}) {
  const currentUrl = activeTab === "before" ? beforeUrl : afterUrl;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            Bukti Foto Piket — {reporterName}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {dutyDate}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "before" ? "default" : "outline"}
            className="min-h-[44px] font-mono text-xs"
            onClick={() => onTabChange("before")}
            disabled={!beforeUrl}
          >
            Sebelum
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "after" ? "default" : "outline"}
            className="min-h-[44px] font-mono text-xs"
            onClick={() => onTabChange("after")}
            disabled={!afterUrl}
          >
            Sesudah
          </Button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt="Foto Bukti Piket Kebersihan"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <HugeiconsIcon icon={Image01Icon} size={32} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
