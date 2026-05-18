"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { TickDouble02Icon, Image01Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import getCroppedImg from "@/lib/utils/cropImage";
import { toast } from "sonner";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  onChangeImage: () => void;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  onChangeImage,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
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
    <AnimatePresence>
      {isOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative flex flex-col w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <HugeiconsIcon icon={Image01Icon} size={20} className="text-blue-500" />
                Sesuaikan Pas Foto
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Geser dan perbesar gambar untuk menyesuaikan posisi. Pastikan wajah terlihat jelas (Rasio 1:1).
              </p>
            </div>

            {/* Cropper Container */}
            <div className="relative w-full h-[60vh] min-h-[300px] max-h-[500px] bg-neutral-100 dark:bg-neutral-950">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // 1:1 Ratio
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom Slider */}
            <div className="px-6 py-4 flex items-center gap-4 bg-neutral-50 dark:bg-neutral-900/50">
              <span className="text-sm font-medium text-neutral-500">-</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-sm font-medium text-neutral-500">+</span>
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-4 flex items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800">
              <Button
                variant="outline"
                onClick={onChangeImage}
                disabled={isProcessing}
                className="h-11 px-5 rounded-xl gap-2 font-medium"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={16} /> Ganti Image
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isProcessing}
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-70 flex-1 sm:flex-none"
              >
                {isProcessing ? "Menyimpan..." : "Simpan & Lanjutkan"}
                {!isProcessing && <HugeiconsIcon icon={TickDouble02Icon} size={18} />}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
