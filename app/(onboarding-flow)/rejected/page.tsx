import type { Metadata } from "next";
import { RejectedCard } from "@/components/onboarding/rejected-card";

export const metadata: Metadata = {
  title: "Pendaftaran Ditolak | UKM Robotik PNP",
  description:
    "Informasi status pendaftaran calon anggota UKM Robotik Politeknik Negeri Padang",
};

export default function RejectedPage() {
  return <RejectedCard />;
}
