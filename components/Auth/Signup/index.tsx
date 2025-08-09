import Link from "next/link";
import SignupWithPassword from "../SignupWithPassword";

export default function Signup() {
  return (
    <>
      <div className="mb-5 sm:mb-8">
        <h1 className="mb-2 font-bold text-gray-800 text-3xl dark:text-white/90 sm:text-4xl">
          Create an Account
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create your account by filling out the information below.
        </p>
      </div>

      <div>
        <SignupWithPassword />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
