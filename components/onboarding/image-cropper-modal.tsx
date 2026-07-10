"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper, { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
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
  const [mounted, setMounted] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && imageSrc && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0f24]/75 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="relative flex flex-col w-full max-w-lg bg-white dark:bg-zinc-950 rounded-none overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
          >
            {/* Header (Deep Navy style) */}
            <div className="bg-[#0a0f24] p-4 border-b border-[#1c69d4]">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <HugeiconsIcon
                  icon={Image01Icon}
                  size={16}
                  className="text-[#0066b1]"
                />
                [Sesuaikan Pas Foto]
              </h3>
              <p className="mt-1 text-[10px] text-zinc-400 font-mono uppercase">
                Geser & perbesar gambar. Rasio dikunci di 1:1.
              </p>
            </div>

            {/* Cropper Area */}
            <div className="relative w-full h-[50vh] min-h-[300px] max-h-[400px] bg-zinc-950">
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
            </div>

            {/* Zoom Slider */}
            <div className="px-6 py-4 flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900">
              <span className="text-xs font-mono text-zinc-500 font-bold">
                [ZOOM -]
              </span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 appearance-none cursor-pointer accent-[#1c69d4] rounded-none"
              />
              <span className="text-xs font-mono text-zinc-500 font-bold">
                [ZOOM +]
              </span>
            </div>

            {/* Footer Actions */}
            <div className="p-4 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="h-9 px-5 rounded-none font-mono text-xs uppercase tracking-wider"
              >
                Batal
              </Button>

              <Button
                onClick={handleSave}
                disabled={isProcessing}
                className="h-9 px-6 rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider shadow-none"
              >
                {isProcessing ? "Memproses..." : "Simpan Foto"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
