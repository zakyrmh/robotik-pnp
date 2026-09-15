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
  { id: 2, label: "Biodata" },
  { id: 3, label: "Akademik" },
  { id: 4, label: "Visi & Komitmen" },
  { id: 5, label: "Berkas" },
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

  // Step 1: Validasi NIM
  const handleCheckNim = async () => {
    setIsCheckingNim(true);
    setClosedError(null);
    try {
      const result = (await checkLegacyMember(nim)) as {
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

  const isRevision = initialProgress.status === "revision";

  return (
    <div className="relative z-10 w-full py-2 sm:py-4">
      <OnboardingHeader />

      {/* Warning banner jika status pendaftaran adalah 'revision' */}
      {isRevision && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs sm:text-sm text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-200 font-bold text-sky-800 dark:bg-sky-900 dark:text-sky-200">
              !
            </span>
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-sky-900 dark:text-sky-200">
                Pendaftaran Memerlukan Revisi / Perbaikan Berkas
              </h4>
              {initialProgress.revisionNotes ? (
                <p className="whitespace-pre-wrap leading-relaxed">
                  <strong>Catatan dari Admin:</strong> {initialProgress.revisionNotes}
                </p>
              ) : (
                <p>
                  Silakan periksa dan perbarui data atau berkas Anda sesuai petunjuk admin.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <OnboardingStepper currentStep={step} steps={STEPS} />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs transition-colors duration-200 min-h-[460px]">
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
              onSuccess={() => router.push("/waiting")}
              initialPaymentMethod={initialProgress.paymentMethod}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
