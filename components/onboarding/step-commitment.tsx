"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  InstagramIcon,
  YoutubeIcon,
  Note01Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadTile } from "./upload-tile";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/utils/upload";
import { saveCommitmentData } from "@/lib/actions/registration";
import type { OnboardingInitialCommitment } from "@/lib/actions/onboarding";
import { toast } from "sonner";

interface StepCommitmentProps {
  onNext: () => void;
  onPrev: () => void;
  initialData?: OnboardingInitialCommitment | null;
}

export function StepCommitment({ onNext, onPrev, initialData }: StepCommitmentProps) {
  const [isPending, startTransition] = useTransition();

  // State lokal — motivation pre-filled jika sudah ada di DB
  const [motivation, setMotivation] = useState(initialData?.motivation ?? "");
  const [igRobotikFile, setIgRobotikFile] = useState<File | null>(null);
  const [igMrcFile, setIgMrcFile] = useState<File | null>(null);
  const [ytFile, setYtFile] = useState<File | null>(null);

  // Status upload granular untuk feedback ke user
  const [uploadLabel, setUploadLabel] = useState("");

  const handleNext = () => {
    if (!motivation.trim()) {
      toast.error("Motivasi wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          return;
        }

        const year = new Date().getFullYear().toString();
        const userId = user.id;

        // Helper upload file ke storage
        const uploadFile = async (
          file: File | null,
          path: string,
          label: string
        ): Promise<string | null> => {
          if (!file) return null;
          setUploadLabel(`Mengompresi ${label}...`);
          const compressed = await compressImage(file);
          setUploadLabel(`Mengunggah ${label}...`);
          const { error } = await supabase.storage
            .from("registrations")
            .upload(path, compressed, { upsert: true });
          if (error) throw new Error(`Gagal upload ${label}: ${error.message}`);
          const { data: { publicUrl } } = supabase.storage
            .from("registrations")
            .getPublicUrl(path);
          return publicUrl;
        };

        // Upload 3 bukti media sosial (opsional)
        const igRobotikUrl = await uploadFile(
          igRobotikFile,
          `${year}/${userId}/ig_robotik_${igRobotikFile?.name}`,
          "Bukti Follow IG Robotik"
        );
        const igMrcUrl = await uploadFile(
          igMrcFile,
          `${year}/${userId}/ig_mrc_${igMrcFile?.name}`,
          "Bukti Follow IG MRC"
        );
        const ytUrl = await uploadFile(
          ytFile,
          `${year}/${userId}/yt_robotik_${ytFile?.name}`,
          "Bukti Subscribe YT"
        );

        setUploadLabel("Menyimpan data...");

        // Simpan ke database via server action
        const result = await saveCommitmentData({
          motivation: motivation.trim(),
          igRobotikUrl,
          igMrcUrl,
          ytUrl,
        });

        if (!result.success) {
          toast.error(result.error || "Gagal menyimpan data komitmen.");
          return;
        }

        toast.success("Data visi & komitmen disimpan.");
        onNext();
      } catch (err) {
        console.error("Error saving commitment data:", err);
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
        toast.error(msg);
      } finally {
        setUploadLabel("");
      }
    });
  };

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="px-8 py-10 overflow-y-auto custom-scrollbar"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Visi &amp; Komitmen Sosial
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Beritahu kami motivasi Anda dan lengkapi syarat media sosial.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <HugeiconsIcon icon={Note01Icon} size={16} className="text-blue-500" />
            Motivasi Masuk UKM Robotik <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Apa alasan Anda ingin bergabung?"
            className="min-h-[120px] rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            disabled={isPending}
          />
        </div>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Bukti Media Sosial
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <UploadTile
                icon={InstagramIcon}
                label="Follow Instagram Robotik"
                hint="Screenshot profil @ukmrobotikpnp · Max 5MB"
                accept="image/*"
                file={igRobotikFile}
                onChange={setIgRobotikFile}
                disabled={isPending}
              />
              {!igRobotikFile && initialData?.igRobotikUrl && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Sudah diunggah sebelumnya. Upload baru untuk mengganti.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <UploadTile
                icon={InstagramIcon}
                label="Follow Instagram MRC"
                hint="Screenshot profil @mrc_pnp · Max 5MB"
                accept="image/*"
                file={igMrcFile}
                onChange={setIgMrcFile}
                disabled={isPending}
              />
              {!igMrcFile && initialData?.igMrcUrl && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Sudah diunggah sebelumnya. Upload baru untuk mengganti.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <UploadTile
                icon={YoutubeIcon}
                label="Subscribe YT Robotik"
                hint="Screenshot bukti subscribe · Max 5MB"
                accept="image/*"
                file={ytFile}
                onChange={setYtFile}
                disabled={isPending}
              />
              {!ytFile && initialData?.ytUrl && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Sudah diunggah sebelumnya. Upload baru untuk mengganti.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPending && uploadLabel && (
        <p className="mt-4 text-sm text-center text-neutral-500 dark:text-neutral-400 animate-pulse">
          <HugeiconsIcon icon={Loading02Icon} size={14} className="inline mr-1.5 animate-spin" />
          {uploadLabel}
        </p>
      )}

      <div className="mt-8 flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-900 pt-4 border-t border-neutral-100">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isPending}
          className="flex-1 h-11 rounded-xl gap-2"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} /> Kembali
        </Button>
        <Button
          onClick={handleNext}
          disabled={isPending}
          className="flex-2 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
        >
          {isPending ? "Menyimpan..." : "Lanjut ke Pembayaran"}
          {!isPending && <HugeiconsIcon icon={ArrowRight02Icon} size={16} />}
        </Button>
      </div>
    </motion.div>
  );
}
