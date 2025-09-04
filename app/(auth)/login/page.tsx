import type { Metadata } from "next";

import LoginForm from "@/app/(auth)/login/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Register | Robotik PNP",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 lg:p-12">
      <div className="flex w-full max-w-5xl gap-6 lg:flex-row flex-col items-stretch">
        <LoginForm />
        <Card className="flex-1 shadow-md border border-slate-200 dark:border-slate-800 lg:flex flex-col hidden">
          <CardContent className="flex-1 flex flex-col justify-start">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <Image src="/images/logo.png" alt="Logo" width={30} height={30} />
              <span className="font-semibold text-xl text-slate-800 dark:text-slate-100">
                Robotik PNP
              </span>
            </Link>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Welcome to Robotik PNP
            </h2>
            <p className="max-w-md text-slate-600 dark:text-slate-400">
              Join our organization to access exclusive features and content. It
              only takes a minute!
            </p>
            <Image src="/images/grid.svg" alt="grid" width={405} height={325}/>
          </CardContent>
        </Card>
      </div>
      <ThemeToggle />
    </div>
  );
}
