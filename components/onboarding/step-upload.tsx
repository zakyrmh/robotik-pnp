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
import { compressImageToWebp } from "@/lib/utils/upload";
import {
  uploadRegistrationFileToR2,
  saveFinalData,
} from "@/lib/actions/registration";
import { toast } from "sonner";
import { ImageCropperModal } from "./image-cropper-modal";
import type { BankAccount } from "@/lib/actions/or-settings";

interface StepUploadProps {
  onPrev: () => void;
  onSuccess: () => void;
  initialPaymentMethod?: string | null;
  paymentAccounts?: BankAccount[];
  registrationFee?: number;
}

export function StepUpload({
  onPrev,
  onSuccess,
  initialPaymentMethod,
  paymentAccounts = [],
  registrationFee = 0,
}: StepUploadProps) {
  const [isPending, startTransition] = useTransition();

  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [ktmFoto, setKtmFoto] = useState<File | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(
    initialPaymentMethod ?? "",
  );

  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<
    string | null
  >(null);

  const handlePasFotoChange = (file: File | null) => {
    if (file) {
      setSelectedImageForCrop(URL.createObjectURL(file));
      setCropperModalOpen(true);
    } else {
      setPasFoto(null);
    }
  };

  // ----------------------------------------------------------------
  // Helper: compress → send to Server Action → return R2 public URL
  //
  // Kompresi dilakukan client-side (WebP ≤ 1 MB untuk foto).
  // PDF bukti bayar tidak dikompresi — dikirim as-is (max 3.5 MB).
  // Setiap upload berjalan secara serial agar tidak spike memory
  // sekaligus, yang penting untuk Vercel Serverless (1 GB RAM).
  // ----------------------------------------------------------------
  const uploadFileToR2 = async (
    file: File | null,
    fileType: "pas_foto" | "ktm" | "payment_proof",
    label: string,
  ): Promise<string | null> => {
    if (!file) return null;

    let fileToUpload: File = file;

    if (file.type.startsWith("image/")) {
      setUploadLabel(`Mengompresi ${label} ke WebP…`);
      // Target ≤ 1 MB, max 1920px — jauh di bawah Vercel body cap 4.5 MB
      fileToUpload = await compressImageToWebp(file, 1, 1920);
    }
    // PDF tidak dikompresi — server action akan tolak jika > 3.5 MB

    setUploadLabel(`Mengunggah ${label} ke cloud…`);
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("fileType", fileType);

    const res = await uploadRegistrationFileToR2(formData);
    if (!res.success || !res.url) {
      throw new Error(res.error ?? `Gagal mengunggah ${label}.`);
    }
    return res.url;
  };

  const handleSubmit = () => {
    if (!pasFoto) {
      toast.error("Pas foto formal wajib diunggah.");
      return;
    }
    if (!paymentProof) {
      toast.error("Bukti pembayaran pendaftaran wajib diunggah.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Metode pembayaran wajib dipilih.");
      return;
    }

    startTransition(async () => {
      try {
        // ---- Upload serial: pas foto → KTM (opsional) → bukti bayar ----
        setUploadProgress(10);
        const pasFotoUrl = await uploadFileToR2(
          pasFoto,
          "pas_foto",
          "Pas Foto",
        );

        setUploadProgress(40);
        const ktmUrl = await uploadFileToR2(ktmFoto, "ktm", "KTM");

        setUploadProgress(70);
        const paymentUrl = await uploadFileToR2(
          paymentProof,
          "payment_proof",
          "Bukti Pembayaran",
        );

        // ---- Simpan URL ke database via Server Action ----
        setUploadProgress(88);
        setUploadLabel("Menyimpan seluruh data pendaftaran…");

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
        toast.success(
          "Pendaftaran berhasil dikirim! Menuju halaman verifikasi…",
        );

        await new Promise((r) => setTimeout(r, 800));
        onSuccess();
      } catch (err) {
        console.error("[StepUpload] Error submitting final data:", err);
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="p-6 sm:p-8 md:p-10 overflow-y-auto"
    >
      <div className="mb-6 space-y-1">
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground tracking-tight">
          Berkas &amp; Pembayaran Registrasi
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Langkah terakhir untuk menyelesaikan pendaftaran anggota baru UKM
          Robotik PNP.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm">
        {/* Foto Profil & KTM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Pas Foto Formal (1:1) <span className="text-destructive">*</span>
            </Label>
            <UploadTile
              icon={Camera01Icon}
              label="Pas Foto"
              hint="Wajah jelas · JPG/PNG · Max 5 MB"
              accept="image/jpeg,image/png"
              file={pasFoto}
              onChange={handlePasFotoChange}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Foto Kartu Tanda Mahasiswa (KTM)
            </Label>
            <UploadTile
              icon={IdentityCardIcon}
              label="Foto KTM"
              hint="Opsional jika belum ada · Max 5 MB"
              accept="image/jpeg,image/png"
              file={ktmFoto}
              onChange={setKtmFoto}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Pembayaran */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary font-mono block">
              Informasi Pembayaran Pendaftaran
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {registrationFee > 0
                ? `Biaya pendaftaran: Rp ${registrationFee.toLocaleString("id-ID")}. `
                : "Pendaftaran tidak dipungut biaya. "}
              Pastikan bukti pembayaran sesuai dengan data berikut.
            </p>
          </div>

          {paymentAccounts.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {paymentAccounts.map((account, index) => (
                <div
                  key={`${account.bank_name}-${account.account_number}-${index}`}
                  className="rounded-xl border border-border bg-secondary/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">
                      {account.bank_name}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Rekening resmi
                    </span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">Nomor rekening</dt>
                      <dd className="font-mono font-semibold tracking-wide text-foreground break-all">
                        {account.account_number}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">Atas nama</dt>
                      <dd className="font-medium text-foreground">
                        {account.account_holder}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Metode Pembayaran <span className="text-destructive">*</span>
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              disabled={isPending}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Pilih Metode Pembayaran" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-popover shadow-lg">
                <SelectItem
                  value="transfer"
                  className="text-xs sm:text-sm cursor-pointer"
                >
                  Transfer Bank / QRIS / E-Wallet
                </SelectItem>
                <SelectItem
                  value="cash"
                  className="text-xs sm:text-sm cursor-pointer"
                >
                  Tunai (Melalui Pengurus UKM)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Bukti Pembayaran Registrasi{" "}
              <span className="text-destructive">*</span>
            </Label>
            <UploadTile
              icon={Wallet02Icon}
              label="Bukti Pembayaran"
              hint="JPG / PNG / PDF · Max 3.5 MB"
              accept="image/*,.pdf"
              file={paymentProof}
              onChange={setPaymentProof}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Info notice */}
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={18}
            className="shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <p className="leading-relaxed">
            Seluruh berkas tersimpan di cloud storage terenkripsi dan akan
            diverifikasi oleh Panitia Open Recruitment UKM Robotik PNP.
          </p>
        </div>
      </div>

      {/* Progress bar selama upload */}
      {isPending && (
        <div className="mt-5 space-y-2 p-3.5 rounded-xl bg-secondary border border-border">
          {uploadLabel && (
            <p className="text-xs text-center font-medium text-foreground flex items-center justify-center gap-1.5">
              <HugeiconsIcon
                icon={Loading02Icon}
                size={14}
                className="animate-spin text-primary"
              />
              {uploadLabel}
            </p>
          )}
          {uploadProgress > 0 && (
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          )}
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
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-2 h-11 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold gap-2 shadow-xs cursor-pointer"
        >
          {isPending ? (
            <>
              Mengirim Pendaftaran…
              <HugeiconsIcon
                icon={Loading02Icon}
                size={16}
                className="animate-spin"
              />
            </>
          ) : (
            <>
              Kirim Pendaftaran
              <HugeiconsIcon icon={TickDouble02Icon} size={16} />
            </>
          )}
        </Button>
      </div>

      <ImageCropperModal
        isOpen={cropperModalOpen}
        imageSrc={selectedImageForCrop}
        onClose={() => {
          setCropperModalOpen(false);
          setSelectedImageForCrop(null);
        }}
        onCropComplete={(croppedFile) => {
          setPasFoto(croppedFile);
          setCropperModalOpen(false);
          setSelectedImageForCrop(null);
        }}
      />
    </motion.div>
  );
}
