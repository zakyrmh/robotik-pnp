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
  closedError?: string | null;
}

export function StepIdentity({
  nim,
  setNim,
  onNext,
  isChecking,
  closedError,
}: StepIdentityProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="p-6 sm:p-8 md:p-10"
    >
      <div className="mb-6 space-y-1">
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground tracking-tight">
          Validasi Identitas
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Masukkan Nomor Induk Mahasiswa (NIM) aktif Anda untuk memeriksa status
          pendaftaran.
        </p>
      </div>

      {/* Info Notice Box */}
      <div className="mb-6 flex gap-3 rounded-xl bg-primary-soft text-primary border border-primary/20 p-4 text-xs sm:text-sm leading-relaxed">
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={18}
          className="mt-0.5 shrink-0 text-primary"
        />
        <p>
          Jika NIM Anda sudah terdaftar sebagai anggota lama, sistem akan secara
          otomatis mengarahkan akun Anda ke halaman dashboard.
        </p>
      </div>

      {closedError && (
        <div className="mb-6 flex gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs sm:text-sm text-destructive">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            size={18}
            className="mt-0.5 shrink-0 text-destructive"
          />
          <div className="space-y-1">
            <p className="font-bold font-mono text-xs uppercase tracking-wider text-destructive">
              Pendaftaran Ditutup
            </p>
            <p className="text-xs leading-relaxed">{closedError}</p>
            <p className="text-[11px] text-muted-foreground">
              Silakan hubungi pengurus atau tunggu pembukaan gelombang
              berikutnya.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="nim"
          className="text-xs sm:text-sm font-semibold text-foreground"
        >
          Nomor Induk Mahasiswa (NIM){" "}
          <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <HugeiconsIcon
            icon={UserCheck01Icon}
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="nim"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            placeholder="Contoh: 22110830XX"
            disabled={isChecking}
            className="h-12 rounded-xl pl-10 font-mono text-base tracking-widest bg-background border-border text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Pastikan NIM yang dimasukkan sesuai dengan Kartu Tanda Mahasiswa (KTM)
          Politeknik Negeri Padang.
        </p>
      </div>

      <Button
        onClick={onNext}
        disabled={nim.trim().length < 8 || isChecking}
        className="mt-8 w-full h-12 min-h-[44px] rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
