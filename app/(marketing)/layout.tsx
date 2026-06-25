import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { PageTransitionWrapper } from "@/components/shared/page-transition-wrapper";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-1">
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
      </main>
      <LandingFooter />
    </div>
  );
}
