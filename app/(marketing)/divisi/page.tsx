import React from "react";
import { createClient } from "@/lib/supabase/server";
import { divisionsData } from "@/lib/data/divisions";
import { DivisiIndexClient } from "@/components/divisi/DivisiIndexClient";

export const metadata = {
  title: "Divisi Kompetisi | UKM Robotik PNP",
  description:
    "Eksplorasi mendalam divisi-divisi kompetisi robotika yang ada di UKM Robotik PNP.",
};

export default async function DivisiIndexPage() {
  const supabase = await createClient();

  // Try to fetch active divisions from Supabase to get the description, id etc.
  const { data: dbDivisions } = await supabase
    .from("divisions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Fallback to static mapping if database is empty/fails
  const slugs = ["krai", "krsbi-b", "krsbi-h", "krsti", "krsri"];

  const divisions = slugs.map((slug) => {
    const staticData = divisionsData[slug];
    const dbData = dbDivisions?.find((d) => d.slug === slug);

    return {
      slug,
      name: dbData?.name || staticData.hero.title,
      description: dbData?.short_description || staticData.hero.subtitle,
      badge_label: dbData?.badge_label || staticData.hero.badge,
    };
  });

  return (
    <div className="bg-canvas-dark min-h-screen text-white pt-24 pb-20">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        <DivisiIndexClient divisions={divisions} />
      </div>
    </div>
  );
}
