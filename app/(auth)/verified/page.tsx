import type { Metadata } from "next";
import { VerifiedCard } from "@/components/features/auth/verified-card";

export const metadata: Metadata = {
  title: "Email Terverifikasi | UKM Robotik PNP",
  description: "Akun UKM Robotik PNP Anda berhasil diverifikasi",
};

export default function VerifiedPage() {
  return <VerifiedCard />;
}
