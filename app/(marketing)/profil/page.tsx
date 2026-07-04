import { Metadata } from "next";
import { HeroSection } from "@/components/profil/hero-section";
import { MotoSloganSection } from "@/components/profil/moto-slogan-section";
import { TimelineSection } from "@/components/profil/timeline-section";
import { BphSection, BphMember } from "@/components/profil/bph-section";
import { WorkshopGallerySection } from "@/components/profil/workshop-gallery-section";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profil | UKM Robotik PNP",
  description:
    "Dapur Inovasi & Pusat Riset Teknologi Robotik Politeknik Negeri Padang. Wadah bagi mahasiswa kreatif, solutif, dan inovatif di bidang robotik.",
  openGraph: {
    title: "Profil | UKM Robotik PNP",
    description:
      "Kenali lebih dekat identitas, arah gerak, sejarah, dan ekosistem riset Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang.",
    type: "website",
  },
};

type RawLegacyMember = {
  full_name: string;
  slug: string | null;
  avatar_url: string | null;
};

function toSingle<T extends object>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw as T[])[0] ?? null;
  return raw;
}

export default async function ProfilPage() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app"
  ).replace(/\/$/, "");

  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${siteUrl}/profil/#webpage`,
    url: `${siteUrl}/profil`,
    name: "Profil | UKM Robotik PNP",
    description:
      "Kenali lebih dekat identitas, arah gerak, sejarah, dan ekosistem riset Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang.",
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    about: {
      "@id": `${siteUrl}/#organization`,
    },
  };

  const supabase = createAdminClient();

  // Fetch active period
  const { data: activePeriod } = await supabase
    .from("membership_periods")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const periodId = activePeriod?.id ?? null;

  // Fetch Ketua Umum, Wakil Ketua 1, Wakil Ketua 2 dari organizational_histories
  const { data: bphRows } = periodId
    ? await supabase
        .from("organizational_histories")
        .select(
          `
          role_name,
          sort_order,
          legacy_members:org_histories_member_fkey (
            full_name,
            avatar_url,
            slug
          )
        `,
        )
        .eq("period_id", periodId)
        .in("role_name", ["Ketua Umum", "Wakil Ketua 1", "Wakil Ketua 2"])
        .order("sort_order", { ascending: true })
    : { data: [] };

  const parsedMembers: BphMember[] = (bphRows ?? []).map((row) => {
    const lm = toSingle(
      row.legacy_members as RawLegacyMember | RawLegacyMember[] | null,
    );
    return {
      role: row.role_name,
      name: lm?.full_name || "Nama Pengurus",
      image: lm?.avatar_url || "/images/logo-ukm-robotik-pnp.webp",
      link: lm?.slug ? `/keanggotaan/member/${lm.slug}` : "#",
    };
  });

  const bphMembers: BphMember[] = [
    {
      role: "Pembina UKM Robotik",
      name: "Ummul Khair, S.T., M.T.",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400",
      link: "#",
    },
    ...parsedMembers,
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutPageJsonLd),
        }}
      />
      <HeroSection />
      <MotoSloganSection />
      <TimelineSection />
      <BphSection members={bphMembers} />
      <WorkshopGallerySection />
    </>
  );
}
