import { getOnboardingProgress } from "@/lib/actions/onboarding";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";

/**
 * Server Component — menentukan step awal dan data pre-fill
 * sebelum render apapun, tanpa flash / loading state.
 */
export default async function OnboardingPage() {
  const progress = await getOnboardingProgress();
  return <OnboardingClient initialProgress={progress} />;
}
