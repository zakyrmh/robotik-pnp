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
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold font-mono transition-all duration-300 ${
                isDone
                  ? "border-pnp-orange bg-pnp-orange text-white"
                  : isCurrent
                    ? "border-pnp-orange bg-card text-pnp-orange"
                    : "border-border bg-card text-muted-foreground"
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
                <span className="absolute -inset-1 rounded-full animate-ping bg-pnp-orange/30" />
              )}
            </div>

            {/* Label (Mobile Hidden) */}
            <span
              className={`ml-2.5 hidden md:inline text-xs font-semibold uppercase tracking-wider font-mono transition-colors ${
                isCurrent
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>

            {/* Connector Line */}
            {i < steps.length - 1 && (
              <div className="mx-3 flex-1 h-px bg-border overflow-hidden">
                <div
                  className="h-full bg-pnp-orange transition-all duration-700"
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
