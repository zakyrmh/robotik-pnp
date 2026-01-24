"use client";

import {
  User,
  FileText,
  CreditCard,
  ShieldCheck,
  Check,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useRegistrationForm,
  RegistrationStep,
} from "./registration-form-context";

// =========================================================
// TYPES
// =========================================================

interface StepInfo {
  id: RegistrationStep;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const STEPS: StepInfo[] = [
  { id: 1, label: "Data Diri", shortLabel: "Data", icon: User },
  { id: 2, label: "Dokumen", shortLabel: "Dokumen", icon: FileText },
  { id: 3, label: "Pembayaran", shortLabel: "Bayar", icon: CreditCard },
  { id: 4, label: "Verifikasi", shortLabel: "Verif", icon: ShieldCheck },
];

// =========================================================
// COMPONENT
// =========================================================

export function RegistrationStepper() {
  const {
    currentStep,
    setCurrentStep,
    canAccessStep,
    isStepCompleted,
    registration,
  } = useRegistrationForm();

  // Don't allow navigation if submitted
  const isSubmitted =
    registration?.status === "submitted" || registration?.status === "verified";

  const handleStepClick = (step: RegistrationStep) => {
    if (isSubmitted) return;
    if (canAccessStep(step)) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop / Tablet Stepper */}
      <div className="hidden sm:flex items-center justify-between mb-8">
        {STEPS.map((step, index) => {
          const isCompleted = isStepCompleted(step.id);
          const isCurrent = currentStep === step.id;
          const isAccessible = canAccessStep(step.id);
          const isLast = index === STEPS.length - 1;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle & Content */}
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={!isAccessible || isSubmitted}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all duration-200",
                  isAccessible && !isSubmitted
                    ? "cursor-pointer hover:scale-105"
                    : "cursor-not-allowed",
                )}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent &&
                      !isCompleted &&
                      "bg-primary border-primary text-white animate-pulse",
                    !isCurrent &&
                      !isCompleted &&
                      isAccessible &&
                      "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400",
                    !isAccessible &&
                      "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : !isAccessible ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-sm font-medium text-center",
                    isCurrent && "text-primary",
                    isCompleted && "text-green-600 dark:text-green-400",
                    !isCurrent && !isCompleted && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all duration-500",
                      isCompleted
                        ? "bg-green-500"
                        : "bg-slate-200 dark:bg-slate-700",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden mb-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((step) => {
            const isCompleted = isStepCompleted(step.id);
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-300",
                  isCompleted && "bg-green-500",
                  isCurrent && !isCompleted && "bg-primary",
                  !isCurrent &&
                    !isCompleted &&
                    "bg-slate-200 dark:bg-slate-700",
                )}
              />
            );
          })}
        </div>

        {/* Current Step Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(() => {
              const currentStepInfo = STEPS.find((s) => s.id === currentStep);
              const Icon = currentStepInfo?.icon || User;
              return (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Langkah {currentStep} dari 4
                    </p>
                    <p className="font-semibold">{currentStepInfo?.label}</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Step Indicators */}
          <div className="flex gap-1">
            {STEPS.map((step) => {
              const isCompleted = isStepCompleted(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = canAccessStep(step.id);

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isAccessible || isSubmitted}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && !isCompleted && "bg-primary text-white",
                    !isCurrent &&
                      !isCompleted &&
                      isAccessible &&
                      "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
                    !isAccessible &&
                      "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600",
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
