import { HugeiconsIcon } from "@hugeicons/react";
import { RobotIcon } from "@hugeicons/core-free-icons";

export function OnboardingHeader() {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col items-center gap-2 text-center">
      {/* Icon Ring */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30 shadow-xs">
        <HugeiconsIcon icon={RobotIcon} size={24} />
      </div>

      <p className="text-micro font-mono font-semibold uppercase tracking-[0.2em] text-pnp-orange">
        UKM ROBOTIK PNP
      </p>

      <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground uppercase">
        Pendaftaran Anggota
      </h1>
    </div>
  );
}
