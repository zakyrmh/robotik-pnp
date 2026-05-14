import { HugeiconsIcon } from "@hugeicons/react";
import { RobotIcon } from "@hugeicons/core-free-icons";

export function OnboardingHeader() {
  return (
    <div className="mb-8 flex flex-col items-center gap-2 text-center">
      {/* Icon Ring */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
        <HugeiconsIcon icon={RobotIcon} size={24} className="text-white" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
        UKM Robotik PNP
      </p>

      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        Pendaftaran Anggota
      </h1>
    </div>
  );
}
