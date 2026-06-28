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
    <div className="bg-canvas-dark text-foreground min-h-screen pt-20">
      <ArtikelClient articles={articles || []} />
    </div>
  );
}
