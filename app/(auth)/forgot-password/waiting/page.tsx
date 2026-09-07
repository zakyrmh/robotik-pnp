import type { Metadata } from "next";
import { ForgotPasswordWaitingCard } from "@/components/features/auth/forgot-password-waiting-card";

export const metadata: Metadata = {
  title: "Cek Email Anda | UKM Robotik PNP",
  description: "Periksa email Anda untuk link reset password",
};

export default function ForgotPasswordWaitingPage() {
  return <ForgotPasswordWaitingCard />;
}
