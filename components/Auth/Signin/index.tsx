import Link from "next/link";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <>
      <div className="mb-5 sm:mb-8">
        <h1 className="mb-2 font-bold text-gray-800 text-3xl dark:text-white/90 sm:text-4xl">
          Login
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please enter your credentials to access your account.
        </p>
      </div>

      <div>
        <SigninWithPassword />
      </div>

      <div className="mt-6 text-center text-gray-500">
        <p>
          Don’t have any account?{" "}
          <Link href="/register" className="text-primary">
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}
