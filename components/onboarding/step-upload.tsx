"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  TickDouble02Icon,
  Camera01Icon,
  Wallet02Icon,
  CheckmarkCircle02Icon,
  IdentityCardIcon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadTile } from "./upload-tile";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/utils/upload";
import { saveFinalData } from "@/lib/actions/registration";
import { toast } from "sonner";
import { ImageCropperModal } from "./image-cropper-modal";

interface StepUploadProps {
  onPrev: () => void;
  onSuccess: () => void;
  initialPaymentMethod?: string | null;
}

export function StepUpload({ onPrev, onSuccess, initialPaymentMethod }: StepUploadProps) {
  const [isPending, startTransition] = useTransition();

  // State lokal — tidak perlu diangkat ke page.tsx
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [ktmFoto, setKtmFoto] = useState<File | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod ?? "");

  // Status upload granular untuk feedback ke user
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // State untuk modal crop
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);

  const handlePasFotoChange = (file: File | null) => {
    if (file) {
      setSelectedImageForCrop(URL.createObjectURL(file));
      setCropperModalOpen(true);
    } else {
      setPasFoto(null);
    }
  };

  const handleSubmit = () => {
    // Validasi sebelum masuk transition
    if (!pasFoto) { toast.error("Pas foto wajib diupload."); return; }
    if (!paymentProof) { toast.error("Bukti pembayaran wajib diupload."); return; }
    if (!paymentMethod) { toast.error("Metode pembayaran wajib dipilih."); return; }

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

        const userId = user.id;
        const year = new Date().getFullYear().toString();

        const uploadFile = async (
          file: File | null,
          bucket: string,
          path: string,
          label: string,
        ): Promise<string | null> => {
          if (!file) return null;
          setUploadLabel(`Mengompresi ${label}...`);
          const compressed = await compressImage(file);
          setUploadLabel(`Mengunggah ${label}...`);
          const { error } = await supabase.storage
            .from(bucket)
            .upload(path, compressed, { upsert: true });
          if (error) throw new Error(`Gagal upload ${label}: ${error.message}`);
          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(path);
          return publicUrl;
        };

        // Upload Pas Foto → bucket "profiles"
        setUploadProgress(10);
        const pasFotoUrl = await uploadFile(
          pasFoto,
          "profiles",
          `${userId}/${pasFoto.name}`,
          "Pas Foto",
        );

        // Upload KTM → bucket "registrations" (opsional)
        setUploadProgress(40);
        const ktmUrl = await uploadFile(
          ktmFoto,
          "registrations",
          `${year}/${userId}/ktm_${ktmFoto?.name}`,
          "KTM",
        );

        // Upload Bukti Pembayaran → bucket "registrations"
        setUploadProgress(65);
        const paymentUrl = await uploadFile(
          paymentProof,
          "registrations",
          `${year}/${userId}/payment_${paymentProof.name}`,
          "Bukti Pembayaran",
        );

        // Simpan URL ke database via server action
        setUploadProgress(85);
        setUploadLabel("Menyimpan data...");

        const result = await saveFinalData({
          pasFotoUrl: pasFotoUrl ?? "",
          ktmUrl,
          paymentProofUrl: paymentUrl ?? "",
          paymentMethod,
        });

        if (!result.success) {
          toast.error(result.error || "Gagal menyimpan data ke database.");
          return;
        }

        setUploadProgress(100);
        setUploadLabel("Selesai!");
        toast.success("Pendaftaran berhasil dikirim!");

        // Beri sedikit jeda agar progress bar terlihat 100% sebelum redirect
        await new Promise((r) => setTimeout(r, 800));
        onSuccess();
      } catch (err) {
        console.error("Error submitting final data:", err);
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
        toast.error("Gagal mengirim pendaftaran: " + msg);
      } finally {
        if (uploadProgress < 100) {
          setUploadProgress(0);
          setUploadLabel("");
        }
      }
    });
  };

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="px-8 py-10 overflow-y-auto custom-scrollbar"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Berkas &amp; Pembayaran
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Langkah terakhir untuk menyelesaikan pendaftaran Anda.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <UploadTile
            icon={Camera01Icon}
            label="Pas Foto"
            hint="Formal · JPG/PNG · Max 5MB"
            accept="image/jpeg,image/png"
            file={pasFoto}
            onChange={handlePasFotoChange}
            disabled={isPending}
          />
          <UploadTile
            icon={IdentityCardIcon}
            label="Foto KTM"
            hint="Opsional · JPG/PNG"
            accept="image/jpeg,image/png"
            file={ktmFoto}
            onChange={setKtmFoto}
            disabled={isPending}
          />
        </div>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Metode Pembayaran <span className="text-red-500">*</span>
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              disabled={isPending}
            >
              <SelectTrigger className="h-11 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <SelectValue placeholder="Pilih Metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">
                  Transfer Bank / E-Wallet
                </SelectItem>
                <SelectItem value="cash">Tunai (Melalui Pengurus)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <UploadTile
            icon={Wallet02Icon}
            label="Bukti Pembayaran"
            hint="PDF / JPG · Max 5MB"
            accept="image/*,.pdf"
            file={paymentProof}
            onChange={setPaymentProof}
            disabled={isPending}
          />
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={18}
            className="mt-0.5 shrink-0"
          />
          <p>
            Seluruh data akan divalidasi manual. Mohon tunggu informasi
            selanjutnya.
          </p>
        </div>
      </div>

      {/* Progress indicator selama upload */}
      {isPending && (
        <div className="mt-4 space-y-2">
          {uploadLabel && (
            <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 animate-pulse">
              <HugeiconsIcon
                icon={Loading02Icon}
                size={14}
                className="inline mr-1.5 animate-spin"
              />
              {uploadLabel}
            </p>
          )}
          {uploadProgress > 0 && (
            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
                className={`h-full ${
                  uploadProgress === 100 ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-900 pt-4 border-t border-neutral-100">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex-1 h-11 rounded-xl gap-2"
          disabled={isPending}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} /> Kembali
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-70"
        >
          {isPending ? (
            <>
              Mengirim...{" "}
              <HugeiconsIcon
                icon={Loading02Icon}
                size={18}
                className="animate-spin"
              />
            </>
          ) : (
            <>
              Kirim Pendaftaran{" "}
              <HugeiconsIcon icon={TickDouble02Icon} size={18} />
            </>
          )}
        </Button>
      </div>

      <ImageCropperModal
        isOpen={cropperModalOpen}
        imageSrc={selectedImageForCrop}
        onClose={() => setCropperModalOpen(false)}
        onCropComplete={(croppedFile) => {
          setPasFoto(croppedFile);
          setCropperModalOpen(false);
          setSelectedImageForCrop(null);
        }}
        onChangeImage={() => {
          setCropperModalOpen(false);
        }}
      />
    </motion.div>
  );
}
