import type { Metadata } from "next";
import HubungiKamiClient from "./HubungiKamiClient";

export const metadata: Metadata = {
  title: "Hubungi Kami — UKM Robotik PNP",
  description:
    "Mari Berkolaborasi dan Terhubung. Hubungi kami untuk pertanyaan seputar riset, kerja sama sponsor, atau event.",
};

export default function HubungiKamiPage() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app"
  ).replace(/\/$/, "");

  const contactPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${siteUrl}/hubungi-kami/#webpage`,
    url: `${siteUrl}/hubungi-kami`,
    name: "Hubungi Kami | UKM Robotik PNP",
    description:
      "Mari Berkolaborasi dan Terhubung. Hubungi kami untuk pertanyaan seputar riset, kerja sama sponsor, atau event.",
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    mainEntity: {
      "@id": `${siteUrl}/#organization`,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground mt-6 sm:mt-0 py-16 sm:py-20 lg:py-24 transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactPageJsonLd),
        }}
      />
      <HubungiKamiClient />
    </div>
  );
}
