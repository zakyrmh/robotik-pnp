import type { Metadata } from "next";

import ForgotPasswordForm from "@/app/(auth)/forgot-password/ForgotPassword";

export const metadata: Metadata = {
  title: "Reset Password | Robotik PNP",
};

export default function RegisterPage() {
  return (
    <>
      <ForgotPasswordForm />
    </>
  );
}
