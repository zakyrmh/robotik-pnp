import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Password | UKM Robotik PNP",
  description:
    "Atur ulang kata sandi akun sistem manajemen UKM Robotik PNP",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
