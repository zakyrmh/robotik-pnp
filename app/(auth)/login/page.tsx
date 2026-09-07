import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = {
  title: "Login Portal | UKM Robotik PNP",
  description: "Masuk ke portal sistem manajemen UKM Robotik PNP",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
