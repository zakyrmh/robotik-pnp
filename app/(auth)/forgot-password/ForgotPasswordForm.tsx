"use client";

import { EmailIcon } from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { auth } from "@/lib/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Please check your inbox.");
      router.push("/login");
      clear();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setEmail("");
  };

  return (
    <>
      <div className="mb-5 sm:mb-8">
        <h1 className="mb-2 font-bold text-gray-800 text-3xl dark:text-white/90 sm:text-4xl">
          Forgot Password
        </h1>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <InputGroup
            type="email"
            label="Email"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your email"
            name="email"
            handleChange={(e) => setEmail(e.target.value)}
            value={email}
            icon={<EmailIcon className="text-gray-500" />}
          />

          {error && (
            <p className="text-red-500 text-center text-sm font-light mb-5">
              {error}
            </p>
          )}

          {success && (
            <p className="text-primary text-center text-sm font-light mb-5">
              {success}
            </p>
          )}

          <div className="mb-4.5">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
            >
              {loading ? "Loading" : "Send Password Reset Link"}
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-t-transparent" />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center text-gray-500">
        <p>
          Login to your account from{" "}
          <Link href="/login" className="text-primary">
            here
          </Link>
        </p>
      </div>
    </>
  );
}
