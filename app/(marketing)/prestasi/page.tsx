import type { Metadata } from "next";
import { getAchievementsAction } from "@/lib/actions/achievements";
import PrestasiClient from "./PrestasiClient";

export const metadata: Metadata = {
  title: "Prestasi & Penghargaan — UKM Robotik PNP",
  description:
    "Rekam jejak perjuangan, kreativitas, dan pencapaian teknologi terbaik dari para talenta muda robotik Politeknik Negeri Padang.",
};

export default async function PrestasiPage() {
  const achievements = await getAchievementsAction();

  return (
    <div className="min-h-screen bg-background text-foreground mt-6 sm:mt-0 py-16 sm:py-20 lg:py-24 transition-colors duration-200">
      <PrestasiClient achievements={achievements} />
    </div>
  );
}
