"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { StepIdentity } from "@/components/onboarding/step-identity";
import { StepPersonal } from "@/components/onboarding/step-personal";
import { StepAcademic } from "@/components/onboarding/step-academic";
import { StepCommitment } from "@/components/onboarding/step-commitment";
import { StepUpload } from "@/components/onboarding/step-upload";
import { checkLegacyMember } from "@/lib/actions/onboarding";
import type { OnboardingProgress } from "@/lib/actions/onboarding";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Validasi NIM" },
  { id: 2, label: "Biodata & Kontak" },
  { id: 3, label: "Akademik & Rekam Jejak" },
  { id: 4, label: "Visi & Komitmen" },
  { id: 5, label: "Berkas & Pembayaran" },
];

interface OnboardingClientProps {
  initialProgress: OnboardingProgress;
}

export function OnboardingClient({ initialProgress }: OnboardingClientProps) {
  const router = useRouter();

  // Mulai langsung dari step yang belum selesai
  const [step, setStep] = useState(initialProgress.startStep);

  // NIM pre-filled dari profiles.nim (untuk StepIdentity)
  const [nim, setNim] = useState(initialProgress.nim ?? "");
  const [isCheckingNim, setIsCheckingNim] = useState(false);
  const [closedError, setClosedError] = useState<string | null>(null);

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // ──────────────────────────────────────────────
  // Step 1: Validasi NIM
  // ──────────────────────────────────────────────
  const handleCheckNim = async () => {
    setIsCheckingNim(true);
    setClosedError(null);
    try {
      const result = await checkLegacyMember(nim) as {
        success: boolean;
        isLegacy?: boolean;
        isClosed?: boolean;
        error?: string;
        message?: string;
      };

      if (!result.success) {
        if (result.isClosed) {
          setClosedError(result.error || "Pendaftaran saat ini ditutup.");
        } else {
          toast.error(result.error || "Gagal memeriksa NIM");
        }
        return;
      }

      if (result.isLegacy) {
        toast.success(
          result.message || "NIM tervalidasi! Mengarahkan ke dashboard...",
        );
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        toast.info(result.message || "Silakan lanjutkan pengisian biodata.");
        nextStep();
      }
    } catch (err: unknown) {
      console.error("Error checking NIM:", err);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsCheckingNim(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-4 sm:p-8">
      <div className="relative z-10 w-full">
        <OnboardingHeader />
        <OnboardingStepper currentStep={step} steps={STEPS} />

        <div className="relative overflow-hidden rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl min-h-125">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepIdentity
                nim={nim}
                setNim={setNim}
                onNext={handleCheckNim}
                onLegacyMemberFound={() => router.push("/dashboard")}
                isChecking={isCheckingNim}
                setIsChecking={setIsCheckingNim}
                closedError={closedError}
              />
            )}
            {step === 2 && (
              <StepPersonal
                onNext={nextStep}
                onPrev={prevStep}
                initialData={initialProgress.personal}
              />
            )}
            {step === 3 && (
              <StepAcademic
                onNext={nextStep}
                onPrev={prevStep}
                initialData={initialProgress.academic}
              />
            )}
            {step === 4 && (
              <StepCommitment
                onNext={nextStep}
                onPrev={prevStep}
                initialData={initialProgress.commitment}
              />
            )}
            {step === 5 && (
              <StepUpload
                onPrev={prevStep}
                onSuccess={() => {
                  window.location.href = "/waiting";
                }}
                initialPaymentMethod={initialProgress.paymentMethod}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
