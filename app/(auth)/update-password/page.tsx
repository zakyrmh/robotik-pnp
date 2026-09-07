import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/features/auth/update-password-form";

export const metadata: Metadata = {
  title: "Perbarui Password | UKM Robotik PNP",
  description: "Atur ulang password akun UKM Robotik PNP Anda",
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
