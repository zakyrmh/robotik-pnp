import type { Metadata } from "next";

import CaangRegisterPage from "@/app/(auth)/caang/register/RegisterPage";

export const metadata: Metadata = {
  title: "Register | Robotik PNP",
};

export default function RegisterPage() {
  return (
    <>
      <CaangRegisterPage />
    </>
  );
}
