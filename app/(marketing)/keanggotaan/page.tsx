import type { Metadata } from "next";
import KeanggotaanClient from "./KeanggotaanClient";

export const metadata: Metadata = {
  title: "Struktur Organisasi — UKM Robotik PNP",
  description:
    "Sinergi di Balik Inovasi. Kenali talenta-talenta berbakat Politeknik Negeri Padang yang menggerakkan roda organisasi dan riset robotika.",
};

export default function KeanggotaanPage() {
  return (
    <div className="bg-canvas-dark text-foreground min-h-screen pt-20">
      <KeanggotaanClient />
    </div>
  );
}
