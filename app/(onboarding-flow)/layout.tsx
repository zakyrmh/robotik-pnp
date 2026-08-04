import { getCurrentUser } from "@/lib/actions/auth";
import { ProfileWidget } from "@/components/onboarding/profile-widget";
import Image from "next/image";

export default async function OnboardingFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Precision Blueprint Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border dark:border-white/10 bg-background/80 backdrop-blur-md shadow-xs transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Sisi Kiri: Logo & Identitas */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <Image
                src="/images/logo-ukm-robotik-pnp.webp"
                alt="Logo UKM Robotik PNP"
                width={32}
                height={32}
                priority
                className="object-contain h-auto w-auto"
              />
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-foreground font-display uppercase">
                UKM Robotik PNP
              </span>
              <span className="hidden sm:inline-block font-mono text-micro uppercase tracking-wider text-pnp-orange bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 px-2 py-0.5 rounded-full font-semibold">
                GERBANG PENERIMAAN
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Profile Widget */}
          <div className="flex items-center gap-4">
            <ProfileWidget user={user} />
          </div>
        </div>
      </header>

      {/* Main Content Centered */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 px-4 md:py-12 md:px-8 relative">
        {/* Subtle Engineering Grid Background */}
        <div className="absolute inset-0 blueprint-grid-bg opacity-30 pointer-events-none" />

        <div className="w-full max-w-5xl relative z-10">{children}</div>
      </main>
    </div>
  );
}
