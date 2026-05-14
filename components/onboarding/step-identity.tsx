import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InformationCircleIcon,
  UserCheck01Icon,
  ArrowRight02Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StepIdentityProps {
  nim: string;
  setNim: (value: string) => void;
  onNext: () => void;
  onLegacyMemberFound: () => void;
  isChecking: boolean;
  setIsChecking: (value: boolean) => void;
}

export function StepIdentity({
  nim,
  setNim,
  onNext,
  isChecking,
}: StepIdentityProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="px-8 py-10"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Validasi Identitas
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Masukkan NIM aktif kamu untuk memeriksa status keanggotaan.
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 flex gap-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={18}
          className="mt-0.5 shrink-0"
        />
        <p>
          Jika NIM kamu terdaftar sebagai anggota lama, kamu akan langsung
          diarahkan ke dashboard.
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="nim"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Nomor Induk Mahasiswa (NIM)
        </Label>
        <div className="relative">
          <HugeiconsIcon
            icon={UserCheck01Icon}
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            id="nim"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            placeholder="Contoh: 22110830XX"
            disabled={isChecking}
            className="h-12 rounded-xl pl-10 font-mono text-base tracking-widest bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus-visible:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={nim.trim().length < 8 || isChecking}
        className="mt-6 w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-md shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {isChecking ? (
          <>
            <HugeiconsIcon
              icon={Loading02Icon}
              size={18}
              className="animate-spin"
            />
            Memeriksa NIM...
          </>
        ) : (
          <>
            Cek Validasi NIM
            <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
          </>
        )}
      </Button>
    </motion.div>
  );
}
