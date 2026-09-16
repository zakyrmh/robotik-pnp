"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonalData, savePersonalData } from "@/lib/actions/registration";
import type { OnboardingInitialPersonal } from "@/lib/actions/onboarding";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";

interface StepPersonalProps {
  onNext: () => void;
  onPrev: () => void;
  initialData?: OnboardingInitialPersonal | null;
}

export function StepPersonal({
  onNext,
  onPrev,
  initialData,
}: StepPersonalProps) {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [nickname, setNickname] = useState(initialData?.nickname ?? "");
  const [gender, setGender] = useState<"L" | "P" | "">(
    initialData?.gender ?? "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    initialData?.phoneNumber ?? "",
  );
  const [pob, setPob] = useState(initialData?.pob ?? "");
  const [dob, setDob] = useState(initialData?.dob ?? "");
  const [originAddress, setOriginAddress] = useState(
    initialData?.originAddress ?? "",
  );
  const [domicileAddress, setDomicileAddress] = useState(
    initialData?.domicileAddress ?? "",
  );

  const handleNext = () => {
    // Validasi field wajib (sebelum masuk transition)
    if (!fullName.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }
    if (!nickname.trim()) {
      toast.error("Nama panggilan wajib diisi.");
      return;
    }
    if (!gender) {
      toast.error("Jenis kelamin wajib dipilih.");
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error("No. WhatsApp wajib diisi.");
      return;
    }
    if (!pob.trim()) {
      toast.error("Tempat lahir wajib diisi.");
      return;
    }
    if (!dob) {
      toast.error("Tanggal lahir wajib diisi.");
      return;
    }
    if (!originAddress.trim()) {
      toast.error("Alamat asal wajib diisi.");
      return;
    }
    if (!domicileAddress.trim()) {
      toast.error("Alamat domisili wajib diisi.");
      return;
    }

    const payload: PersonalData = {
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      gender: gender as "L" | "P",
      phoneNumber: phoneNumber.trim(),
      pob: pob.trim(),
      dob,
      originAddress: originAddress.trim(),
      domicileAddress: domicileAddress.trim(),
    };

    startTransition(async () => {
      try {
        const result = await savePersonalData(payload);

        if (!result.success) {
          toast.error(result.error || "Gagal menyimpan data pribadi.");
          return;
        }

        toast.success("Data pribadi berhasil disimpan.");
        onNext();
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  };

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="p-6 sm:p-8 md:p-10 overflow-y-auto"
    >
      <div className="mb-6 space-y-1">
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground tracking-tight">
          Data Pribadi &amp; Kontak
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Lengkapi identitas diri dan nomor kontak aktif untuk keperluan
          verifikasi.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-5 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Contoh: Muhammad Zaky"
              className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Nama Panggilan <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Contoh: Zaky"
              className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Jenis Kelamin <span className="text-destructive">*</span>
            </Label>
            <Select
              value={gender}
              onValueChange={(v) => setGender(v as "L" | "P")}
              disabled={isPending}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Pilih Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-popover shadow-lg">
                <SelectItem
                  value="L"
                  className="text-xs sm:text-sm cursor-pointer"
                >
                  Laki-laki (L)
                </SelectItem>
                <SelectItem
                  value="P"
                  className="text-xs sm:text-sm cursor-pointer"
                >
                  Perempuan (P)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              No. WhatsApp Aktif <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="081234567890"
              className="h-11 rounded-xl bg-background border-border text-sm font-mono text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Tempat Lahir <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Contoh: Kota Padang"
              className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
              value={pob}
              onChange={(e) => setPob(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Tanggal Lahir <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              className="h-11 rounded-xl bg-background border-border text-sm font-mono text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Alamat Asal (KTP) <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Tuliskan alamat lengkap sesuai KTP..."
            className="rounded-xl bg-background border-border min-h-[72px] text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed"
            value={originAddress}
            onChange={(e) => setOriginAddress(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Alamat Domisili (Saat Ini){" "}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Tuliskan alamat tempat tinggal / kos saat ini di Padang..."
            className="rounded-xl bg-background border-border min-h-[72px] text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed"
            value={domicileAddress}
            onChange={(e) => setDomicileAddress(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

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
              Lanjut ke Akademik
              <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
