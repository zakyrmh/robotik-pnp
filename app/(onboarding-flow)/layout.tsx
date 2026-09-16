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
      {/* Top Bar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md shadow-xs transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Sisi Kiri: Logo & Identitas */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
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
              <span className="text-sm font-bold tracking-tight text-foreground font-heading uppercase">
                UKM Robotik PNP
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-accent-foreground bg-accent border border-accent-strong/30 px-2 py-0.5 rounded-full font-semibold">
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
      <main className="flex-1 flex flex-col items-center justify-center py-6 px-4 md:py-10 md:px-8 relative">
        <div className="w-full max-w-4xl relative z-10">{children}</div>
      </main>
    </div>
  );
}
