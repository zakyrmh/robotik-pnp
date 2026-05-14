import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface Step {
  id: number;
  label: string;
}

interface OnboardingStepperProps {
  currentStep: number;
  steps: Step[];
}

export function OnboardingStepper({
  currentStep,
  steps,
}: OnboardingStepperProps) {
  return (
    <div className="mb-6 flex items-center gap-0">
      {steps.map((s, i) => {
        const isDone = currentStep > s.id;
        const isCurrent = currentStep === s.id;

        return (
          <div key={s.id} className="flex flex-1 items-center">
            {/* Circle Indicator */}
            <div
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300 ${
                isDone
                  ? "border-blue-600 bg-blue-600 text-white"
                  : isCurrent
                    ? "border-blue-600 bg-white dark:bg-neutral-900 text-blue-600"
                    : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-400"
              }`}
            >
              {isDone ? (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={16}
                  className="text-white"
                />
              ) : (
                s.id
              )}

              {isCurrent && (
                <span className="absolute -inset-1 rounded-full animate-ping bg-blue-400/30" />
              )}
            </div>

            {/* Label (Mobile Hidden) */}
            <span
              className={`ml-2 hidden md:inline text-xs font-medium transition-colors ${
                isCurrent
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {s.label}
            </span>

            {/* Connector Line */}
            {i < steps.length && (
              <div className="mx-3 flex-1 h-px bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-700"
                  style={{ width: isDone ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
