import type { Metadata } from "next";
import HubungiKamiClient from "./HubungiKamiClient";

export const metadata: Metadata = {
  title: "Hubungi Kami — UKM Robotik PNP",
  description:
    "Mari Berkolaborasi dan Terhubung. Hubungi kami untuk pertanyaan seputar riset, kerja sama sponsor, atau event.",
};

export default function HubungiKamiPage() {
  return (
    <div className="bg-canvas-dark text-foreground min-h-screen pt-20">
      <HubungiKamiClient />
    </div>
  );
}
