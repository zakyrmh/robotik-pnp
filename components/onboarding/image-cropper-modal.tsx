"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import getCroppedImg from "@/lib/utils/cropImage";
import { toast } from "sonner";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropComplete(croppedFile);
      } else {
        toast.error("Gagal melakukan crop gambar.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan saat proses crop.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-lg rounded-2xl border border-border p-0 overflow-hidden bg-card shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-card">
          <DialogTitle className="text-base font-bold font-heading text-foreground flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary-soft text-primary">
              <HugeiconsIcon icon={Image01Icon} size={16} />
            </div>
            Sesuaikan Pas Foto (Crop 1:1)
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Geser posisi dan perbesar foto agar wajah terlihat simetris di
            tengah.
          </DialogDescription>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-[50vh] min-h-[280px] max-h-[380px] bg-black/90">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
            />
          )}
        </div>

        {/* Zoom Slider */}
        <div className="px-6 py-3.5 flex items-center gap-3 bg-secondary/60 border-t border-border">
          <span className="text-xs font-mono text-muted-foreground font-semibold">
            Zoom
          </span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-label="Zoom foto"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="text-xs font-mono text-muted-foreground font-semibold min-w-8 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Footer Actions */}
        <div className="p-4 flex items-center justify-end gap-2.5 border-t border-border bg-card">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="h-10 px-4 rounded-xl text-xs font-medium border-border"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs"
          >
            {isProcessing ? "Memproses..." : "Simpan Pas Foto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
