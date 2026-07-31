import type { Metadata } from "next";
import { getOnboardingProgress } from "@/lib/actions/onboarding";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";

export const metadata: Metadata = {
  title: "Form Pendaftaran Anggota | UKM Robotik PNP",
  description:
    "Lengkapi data pendaftaran calon anggota UKM Robotik Politeknik Negeri Padang",
};

/**
 * Server Component — menentukan step awal dan data pre-fill
 * sebelum render apapun, tanpa flash / loading state.
 */
export default async function OnboardingPage() {
  const progress = await getOnboardingProgress();
  return <OnboardingClient initialProgress={progress} />;
}
