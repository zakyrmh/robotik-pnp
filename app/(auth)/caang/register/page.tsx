import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RegisterForm from "@/app/(auth)/caang/register/RegisterForm";

export const metadata: Metadata = {
  title: "Register | Robotik PNP",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side form */}
      <div className="flex w-full flex-col justify-center p-6 md:w-1/2 lg:p-12">
        <RegisterForm />
      </div>

      {/* Right side branding */}
      <div className="relative hidden h-full w-1/2 bg-slate-100 dark:bg-slate-900 md:flex flex-col items-center justify-center">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <Image
            src="/images/logo/logo.webp"
            alt="Logo"
            width={48}
            height={48}
          />
          <span className="font-semibold text-xl text-slate-800 dark:text-slate-100">
            Robotik PNP
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Welcome to Robotik PNP
        </h2>
        <p className="max-w-md text-center text-slate-600 dark:text-slate-400">
          Join our organization to access exclusive features and content. It
          only takes a minute!
        </p>
        <Image
          src="/images/grids/grid-02.svg"
          alt="Illustration"
          width={400}
          height={300}
          className="mt-10 opacity-80 dark:opacity-30"
        />
      </div>
    </div>
  );
}
