import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { PageTransitionWrapper } from "@/components/shared/page-transition-wrapper";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app"
  ).replace(/\/$/, "");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "UKM Robotik Politeknik Negeri Padang",
    alternateName: "UKM Robotik PNP",
    url: siteUrl,
    logo: `${siteUrl}/images/logo-ukm-robotik-pnp.webp`,
    sameAs: [
      "https://www.instagram.com/robotikpnp/",
      "https://www.youtube.com/@robotikpnp",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kampus Politeknik Negeri Padang, Limau Manis",
      addressLocality: "Padang",
      addressRegion: "Sumatera Barat",
      postalCode: "25164",
      addressCountry: "ID",
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
      <LandingNavbar />
      <main className="flex-1">
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
      </main>
      <LandingFooter />
    </div>
  );
}
