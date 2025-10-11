import type { Metadata } from "next";

import LoginForm from "@/app/(auth)/login/LoginForm";

export const metadata: Metadata = {
  title: "Login | Robotik PNP",
};

export default function RegisterPage() {
  return (
    <>
      <LoginForm />
    </>
  );
}
