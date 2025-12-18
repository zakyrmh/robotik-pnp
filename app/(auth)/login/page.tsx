import type { Metadata } from "next";

import LoginForm from "@/app/(auth)/login/_components/LoginForm";

export const metadata: Metadata = {
  title: "Login | Robotik PNP",
};

export default function LoginPage() {
  return (
    <>
      <LoginForm />
    </>
  );
}
