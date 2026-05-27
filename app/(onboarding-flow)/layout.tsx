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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Navbar / Top-Bar with Glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md shadow-xs transition-colors">
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
                className="object-contain"
              />
            </div>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm font-bold tracking-tight text-foreground">
                UKM Robotik PNP
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline-block">
                — Gerbang Penerimaan
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Profile Widget & Logout */}
          <div className="flex items-center gap-4">
            <ProfileWidget user={user} />
          </div>
        </div>
      </header>

      {/* Main Content Centered */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 px-4 md:py-12 md:px-8">
        <div className="w-full max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
