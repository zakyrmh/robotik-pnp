import type { Metadata } from "next";

import ActionPage from "@/app/(auth)/action/ActionPage";

export const metadata: Metadata = {
  title: "Action | Robotik PNP",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 lg:p-12">
      <div className="flex w-full max-w-5xl gap-6 lg:flex-row flex-col items-stretch">
        <ActionPage />
      </div>
    </div>
  );
}
