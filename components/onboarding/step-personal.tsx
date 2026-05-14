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
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";

interface StepPersonalProps {
  onNext: () => void;
  onPrev: () => void;
  initialData?: OnboardingInitialPersonal | null;
}

export function StepPersonal({ onNext, onPrev, initialData }: StepPersonalProps) {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [nickname, setNickname] = useState(initialData?.nickname ?? "");
  const [gender, setGender] = useState<"L" | "P" | "">(initialData?.gender ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber ?? "");
  const [pob, setPob] = useState(initialData?.pob ?? "");
  const [dob, setDob] = useState(initialData?.dob ?? "");
  const [originAddress, setOriginAddress] = useState(initialData?.originAddress ?? "");
  const [domicileAddress, setDomicileAddress] = useState(initialData?.domicileAddress ?? "");

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

        toast.success("Data pribadi disimpan.");
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
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
      className="px-8 py-10 overflow-y-auto custom-scrollbar"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Data Pribadi &amp; Kontak
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Lengkapi biodata dasar Anda.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="John Doe"
              className="h-10 rounded-xl"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Nama Panggilan <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Doe"
              className="h-10 rounded-xl"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Jenis Kelamin <span className="text-red-500">*</span>
            </Label>
            <Select
              value={gender}
              onValueChange={(v) => setGender(v as "L" | "P")}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              No. WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="0812..."
              className="h-10 rounded-xl"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Tempat Lahir <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Kota Padang"
              className="h-10 rounded-xl"
              value={pob}
              onChange={(e) => setPob(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Tanggal Lahir <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              className="h-10 rounded-xl"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase text-neutral-500">
            Alamat Asal (KTP) <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Alamat lengkap sesuai KTP"
            className="rounded-xl min-h-[70px]"
            value={originAddress}
            onChange={(e) => setOriginAddress(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase text-neutral-500">
            Alamat Domisili <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Alamat kos atau rumah saat ini"
            className="rounded-xl min-h-[70px]"
            value={domicileAddress}
            onChange={(e) => setDomicileAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-900 pt-4">
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
          className="flex-2 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {isPending ? "Menyimpan..." : "Lanjut"}
          {!isPending && <HugeiconsIcon icon={ArrowRight02Icon} size={16} />}
        </Button>
      </div>
    </motion.div>
  );
}
