import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

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
  const currentStepObj = steps.find((s) => s.id === currentStep);

  return (
    <div className="mb-6 sm:mb-8 space-y-3">
      {/* Desktop & Tablet Stepper Bar */}
      <div className="hidden sm:flex items-center gap-0">
        {steps.map((s, i) => {
          const isDone = currentStep > s.id;
          const isCurrent = currentStep === s.id;

          return (
            <div key={s.id} className="flex flex-1 items-center">
              {/* Circle Indicator */}
              <div
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold font-mono transition-all duration-300",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : isCurrent
                      ? "border-primary bg-primary-soft text-primary ring-4 ring-primary/15 font-bold"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {isDone ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={16}
                    className="text-primary-foreground"
                  />
                ) : (
                  s.id
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "ml-2.5 hidden md:inline text-xs font-medium uppercase tracking-wider font-mono transition-colors",
                  isCurrent
                    ? "text-foreground font-semibold"
                    : isDone
                      ? "text-foreground/80"
                      : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>

              {/* Connector Line */}
              {i < steps.length - 1 && (
                <div className="mx-2.5 md:mx-3.5 flex-1 h-0.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: isDone ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Badge & Progress */}
      <div className="block sm:hidden space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary font-mono uppercase tracking-wider">
            Langkah {currentStep} dari {steps.length}
          </span>
          <span className="font-medium text-foreground">
            {currentStepObj?.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
