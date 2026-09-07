import type { Metadata } from "next";
import { getPublicEventOverviewAction } from "@/lib/actions/event-public";
import { MrcHero } from "@/components/event/mrc-hero";
import { MrcCategoryGrid } from "@/components/event/mrc-category-grid";
import { MrcStatsSection } from "@/components/event/mrc-stats-section";
import { MrcTimeline } from "@/components/event/mrc-timeline";
import { MrcFaqAccordion } from "@/components/event/mrc-faq-accordion";
import { MrcContactSection } from "@/components/event/mrc-contact-section";

export const metadata: Metadata = {
  title:
    "Minangkabau Robot Contest 2026 - UKM Robotik Politeknik Negeri Padang",
  description:
    "Portal resmi pendaftaran Minangkabau Robot Contest 2026. Kompetisi robotika dan inovasi teknologi untuk siswa dan mahasiswa.",
  openGraph: {
    title: "Minangkabau Robot Contest 2026 - UKM Robotik PNP",
    description:
      "Daftarkan tim robotik Anda di Minangkabau Robot Contest 2026. Cek sisa kuota, cabang lomba, dan informasi peraturan resmi.",
    images: ["/images/logo-ukm-robotik-pnp.webp"],
  },
};

export default async function MrcPortalPage() {
  const res = await getPublicEventOverviewAction();

  const categories = res.success && res.data ? res.data.categories : [];
  const settings = res.success && res.data ? res.data.settings : null;
  const stats =
    res.success && res.data
      ? res.data.stats
      : {
          totalTeams: 0,
          totalInstitutions: 0,
          totalCities: 0,
          topInstitutions: [],
        };

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 sm:space-y-24">
      {/* 1. Hero Banner with Batch Countdown & CTAs */}
      <MrcHero settings={settings} />

      {/* 2. Category Grid & Real-time Quota Status */}
      <MrcCategoryGrid categories={categories} settings={settings} />

      {/* 3. Public Aggregated Statistics */}
      <MrcStatsSection stats={stats} />

      {/* 4. Event Timeline & Milestones */}
      <MrcTimeline settings={settings} />

      {/* 5. Rulebook Downloads & FAQ Accordion */}
      <MrcFaqAccordion categories={categories} />

      {/* 6. Contact Person / Narahubung */}
      <MrcContactSection />
    </div>
  );
}
