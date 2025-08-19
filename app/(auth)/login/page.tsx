import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/app/(auth)/login/LoginForm";

export const metadata: Metadata = {
  title: "Login | UKM Robotik PNP",
};

export default function SignIn() {
  return (
    <>
      <div className="flex flex-wrap items-center">
        <div className="w-full xl:w-1/2">
          <div className="w-full p-4 sm:p-12.5 xl:p-15">
            <LoginForm />
          </div>
        </div>

        <div className="hidden w-full p-7.5 xl:block xl:w-1/2">
          <div className="custom-gradient-1 overflow-hidden rounded-2xl px-12.5 pt-12.5 dark:!bg-dark-2 dark:bg-none">
            <Link className="flex items-center gap-2 mb-10" href="/">
              <Image
                src={"/images/logo/logo.webp"}
                alt="Logo"
                width={43}
                height={43}
              />
              <span className="font-semibold text-dark dark:text-white">Robotik PNP</span>
            </Link>
            <p className="mb-3 text-xl font-medium text-dark dark:text-white">
              Welcome Back!
            </p>

            <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
              We&apos;re Glad to See You Again
            </h1>

            <p className="w-full max-w-[375px] font-medium text-dark-4 dark:text-dark-6">
              Your journey into the world of robotics continues. Let&apos;s build something amazing today.
            </p>

            <div className="mt-31">
              <Image
                src={"/images/grids/grid-02.svg"}
                alt="Logo"
                width={405}
                height={325}
                className="mx-auto dark:opacity-30"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
