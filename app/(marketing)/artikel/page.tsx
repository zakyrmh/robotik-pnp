import type { Metadata } from "next";
import { getArticlesAction } from "@/lib/actions/articles";
import ArtikelClient from "./ArtikelClient";

export const metadata: Metadata = {
  title: "Artikel & Berita — UKM Robotik PNP",
  description:
    "Kabar terbaru, riset, dan teknologi dari UKM Robotik Politeknik Negeri Padang.",
};

export default async function ArtikelPage() {
  const articles = await getArticlesAction();

  return (
    <div className="min-h-screen bg-background text-foreground mt-6 sm:mt-0 py-16 sm:py-20 lg:py-24 transition-colors duration-200">
      <ArtikelClient articles={articles || []} />
    </div>
  );
}
