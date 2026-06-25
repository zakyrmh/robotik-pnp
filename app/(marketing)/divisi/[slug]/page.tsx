import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { divisionsData } from "@/lib/data/divisions";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

import { HeroSection } from "@/components/divisi/HeroSection";
import { TechSpecsTabs } from "@/components/divisi/TechSpecsTabs";
import { DivisionLineUp } from "@/components/divisi/DivisionLineUp";
import { BentoMilestones } from "@/components/divisi/BentoMilestones";
import { ResearchGallery } from "@/components/divisi/ResearchGallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = divisionsData[slug];

  if (!data) {
    return { title: "Divisi Tidak Ditemukan | UKM Robotik PNP" };
  }

  return {
    title: `${data.hero.title} | Spesifikasi Divisi | UKM Robotik PNP`,
    description: data.hero.subtitle,
  };
}

export default async function DivisionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Check if slug exists in static definitions
  const staticData = divisionsData[slug];
  if (!staticData) {
    notFound();
  }

  // 2. Fetch Dynamic Data from Supabase
  const supabase = await createClient();

  // Get division metadata (to get division_id for achievements)
  const { data: dbDivision } = await supabase
    .from("divisions")
    .select("id, name")
    .eq("slug", slug)
    .single();

  let milestones = [];
  if (dbDivision?.id) {
    // Fetch achievements related to this division
    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")
      .eq("division_id", dbDivision.id)
      .order("year", { ascending: false });

    if (achievementsData) {
      milestones = achievementsData;
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />

      <main className="flex-1 bg-canvas-dark">
        {/* SECTION 1: HERO */}
        <HeroSection
          badge={staticData.hero.badge}
          title={staticData.hero.title}
          subtitle={staticData.hero.subtitle}
          image={staticData.hero.image}
        />

        {/* SECTION 2: TECH SPECS */}
        <TechSpecsTabs specs={staticData.specs} />

        {/* SECTION 3: LINE-UP */}
        <DivisionLineUp members={staticData.team} />

        {/* SECTION 4: MILESTONES (DYNAMIC) */}
        <BentoMilestones milestones={milestones} />

        {/* SECTION 5: GALLERY */}
        <ResearchGallery items={staticData.gallery} />
      </main>

      <LandingFooter />
    </div>
  );
}
