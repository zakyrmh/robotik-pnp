"use client";

import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { EmailIcon, PasswordIcon, UserIcon } from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || !email || !password || !repassword) {
      setError("Please fill in all the fields.");
      setLoading(false);
      return;
    }

    if (password !== repassword) {
      setError("Password and re-password do not match.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", user.uid), {
        name,
        email: user.email,
        createdAt: new Date(),
      });

      await sendEmailVerification(user);
      
      router.push("/verify-email");
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRepassword("");
  };
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
        <form onSubmit={handleSubmit}>
          <InputGroup
            type="text"
            label="Name"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your full name"
            name="name"
            handleChange={(e) => setName(e.target.value)}
            value={name}
            icon={<UserIcon className="text-gray-500" />}
          />

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

          <InputGroup
            type="password"
            label="Password"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your password"
            name="password"
            handleChange={(e) => setPassword(e.target.value)}
            value={password}
            icon={<PasswordIcon className="text-gray-500" />}
          />

          <InputGroup
            type="password"
            label="Re-type Password"
            className="mb-6 [&_input]:py-[15px]"
            placeholder="Re-enter your password"
            name="password"
            handleChange={(e) => setRepassword(e.target.value)}
            value={repassword}
            icon={<PasswordIcon className="text-gray-500" />}
          />

          {error && (
            <p className="text-red-500 text-center text-sm font-light mb-5">
              {error}
            </p>
          )}

          <div className="mb-4.5">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
            >
              {loading ? "Loading..." : "Sign Up"}
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-t-transparent" />
              )}
            </button>
          </div>
        </form>
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
