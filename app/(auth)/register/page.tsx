import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/auth/register-form";

export const metadata: Metadata = {
  title: "Portal Registrasi | UKM Robotik PNP",
  description:
    "Daftar akun baru calon anggota UKM Robotik Politeknik Negeri Padang",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
