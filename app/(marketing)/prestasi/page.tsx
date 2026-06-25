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
    <div className="bg-canvas-dark text-foreground min-h-screen pt-20">
      <PrestasiClient achievements={achievements} />
    </div>
  );
}
