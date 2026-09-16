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
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadTile } from "./upload-tile";
import { compressImageToWebp } from "@/lib/utils/upload";
import {
  saveCommitmentData,
  uploadCommitmentProofToR2,
} from "@/lib/actions/registration";
import type { OnboardingInitialCommitment } from "@/lib/actions/onboarding";
import { toast } from "sonner";

interface StepCommitmentProps {
  onNext: () => void;
  onPrev: () => void;
  initialData?: OnboardingInitialCommitment | null;
}

export function StepCommitment({
  onNext,
  onPrev,
  initialData,
}: StepCommitmentProps) {
  const [isPending, startTransition] = useTransition();

  const [motivation, setMotivation] = useState(initialData?.motivation ?? "");
  const [igRobotikFile, setIgRobotikFile] = useState<File | null>(null);
  const [igMrcFile, setIgMrcFile] = useState<File | null>(null);
  const [ytFile, setYtFile] = useState<File | null>(null);

  const [uploadLabel, setUploadLabel] = useState("");

  const handleNext = () => {
    if (!motivation.trim()) {
      toast.error("Motivasi wajib diisi.");
      return;
    }

    const missingProofs = [
      !igRobotikFile && !initialData?.igRobotikUrl && "Follow IG Robotik",
      !igMrcFile && !initialData?.igMrcUrl && "Follow IG MRC",
      !ytFile && !initialData?.ytUrl && "Subscribe YouTube",
    ].filter((proof): proof is string => Boolean(proof));

    if (missingProofs.length > 0) {
      toast.error(`Bukti wajib diunggah: ${missingProofs.join(", ")}.`);
      return;
    }

    startTransition(async () => {
      try {
        const uploadFileToR2 = async (
          file: File | null,
          proofType: "ig_robotik" | "ig_mrc" | "yt_robotik",
          label: string,
          existingUrl?: string | null,
        ): Promise<string | null> => {
          if (!file) return existingUrl ?? null;

          setUploadLabel(`Mengompresi ${label} ke WebP...`);
          const compressedWebp = await compressImageToWebp(file, 1, 1920);

          setUploadLabel(`Mengunggah ${label}...`);
          const formData = new FormData();
          formData.append("file", compressedWebp);
          formData.append("proofType", proofType);

          const res = await uploadCommitmentProofToR2(formData);
          if (!res.success || !res.url) {
            throw new Error(`Gagal upload ${label}: ${res.error}`);
          }
          return res.url;
        };

        const igRobotikUrl = await uploadFileToR2(
          igRobotikFile,
          "ig_robotik",
          "Bukti Follow IG Robotik",
          initialData?.igRobotikUrl,
        );
        const igMrcUrl = await uploadFileToR2(
          igMrcFile,
          "ig_mrc",
          "Bukti Follow IG MRC",
          initialData?.igMrcUrl,
        );
        const ytUrl = await uploadFileToR2(
          ytFile,
          "yt_robotik",
          "Bukti Subscribe YouTube",
          initialData?.ytUrl,
        );

        if (!igRobotikUrl || !igMrcUrl || !ytUrl) {
          toast.error("Bukti dukungan media sosial wajib diunggah lengkap.");
          return;
        }

        setUploadLabel("Menyimpan data...");

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

        toast.success("Visi & bukti komitmen sosial berhasil disimpan.");
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="p-6 sm:p-8 md:p-10 overflow-y-auto"
    >
      <div className="mb-6 space-y-1">
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground tracking-tight">
          Visi &amp; Komitmen Sosial
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Sampaikan motivasi Anda bergabung dengan UKM Robotik dan sertakan
          bukti dukungan media sosial.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm">
        {/* Motivasi */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Note01Icon}
              size={15}
              className="text-primary"
            />
            Motivasi Bergabung UKM Robotik{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Ceritakan alasan, ketertarikan, atau target yang ingin Anda capai di bidang robotika..."
            className="min-h-[110px] rounded-xl bg-background border-border text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="h-px bg-border" />

        {/* Media Sosial */}
        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary font-mono block">
              Bukti Dukungan Media Sosial{" "}
              <span className="text-destructive">*</span>
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unggah tangkapan layar (screenshot) bukti follow Instagram &amp;
              subscribe YouTube. Ketiga bukti wajib diisi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* IG Robotik */}
            <div className="space-y-1.5">
              <UploadTile
                icon={InstagramIcon}
                label="Follow IG Robotik"
                hint="Screenshot @ukmrobotikpnp"
                accept="image/*"
                file={igRobotikFile}
                onChange={setIgRobotikFile}
                disabled={isPending}
              />
              {!igRobotikFile && initialData?.igRobotikUrl && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 px-1.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={13}
                    className="shrink-0"
                  />
                  Sudah terunggah sebelumnya
                </div>
              )}
            </div>

            {/* IG MRC */}
            <div className="space-y-1.5">
              <UploadTile
                icon={InstagramIcon}
                label="Follow IG MRC"
                hint="Screenshot @mrc_pnp"
                accept="image/*"
                file={igMrcFile}
                onChange={setIgMrcFile}
                disabled={isPending}
              />
              {!igMrcFile && initialData?.igMrcUrl && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 px-1.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={13}
                    className="shrink-0"
                  />
                  Sudah terunggah sebelumnya
                </div>
              )}
            </div>

            {/* YouTube */}
            <div className="space-y-1.5">
              <UploadTile
                icon={YoutubeIcon}
                label="Subscribe YouTube"
                hint="Screenshot UKM Robotik PNP"
                accept="image/*"
                file={ytFile}
                onChange={setYtFile}
                disabled={isPending}
              />
              {!ytFile && initialData?.ytUrl && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 px-1.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={13}
                    className="shrink-0"
                  />
                  Sudah terunggah sebelumnya
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPending && uploadLabel && (
        <div className="mt-4 p-3 rounded-xl bg-primary-soft/50 border border-primary/20 flex items-center justify-center gap-2 text-xs font-medium text-primary animate-pulse">
          <HugeiconsIcon
            icon={Loading02Icon}
            size={16}
            className="animate-spin"
          />
          {uploadLabel}
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isPending}
          className="flex-1 h-11 min-h-[44px] rounded-xl border-border text-xs sm:text-sm font-medium gap-2 cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          Kembali
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="flex-2 h-11 min-h-[44px] rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-semibold gap-2 shadow-xs cursor-pointer"
        >
          {isPending ? (
            <>
              <HugeiconsIcon
                icon={Loading02Icon}
                size={16}
                className="animate-spin"
              />
              Menyimpan...
            </>
          ) : (
            <>
              Lanjut ke Berkas &amp; Pembayaran
              <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
