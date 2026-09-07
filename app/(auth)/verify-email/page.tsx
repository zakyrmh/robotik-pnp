import type { Metadata } from "next";
import { VerifyEmailCard } from "@/components/features/auth/verify-email-card";

export const metadata: Metadata = {
  title: "Verifikasi Email | UKM Robotik PNP",
  description: "Periksa email Anda untuk konfirmasi pendaftaran",
};

export default function VerifyEmailPage() {
  return <VerifyEmailCard />;
}
