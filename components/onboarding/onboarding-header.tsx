import { HugeiconsIcon } from "@hugeicons/react";
import { RobotIcon } from "@hugeicons/core-free-icons";

export function OnboardingHeader() {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col items-center gap-2 text-center">
      <p className="text-micro font-mono font-semibold uppercase tracking-[0.2em] text-pnp-orange">
        UKM ROBOTIK PNP
      </p>

      <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground uppercase">
        Pendaftaran Anggota
      </h1>
    </div>
  );
}
