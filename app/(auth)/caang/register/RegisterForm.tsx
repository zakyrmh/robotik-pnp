"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clear = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRepassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || !email || !password || !repassword) {
      setError("Harap isi semua kolom.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi harus lebih dari 8 karakter.");
      setLoading(false);
      return;
    }

    if (password !== repassword) {
      setError("Kata sandi tidak sama.");
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

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        name,
        email: user.email,
        createdAt: new Date(),
      });

      await sendEmailVerification(user);

      clear();
      router.push("/verify-email");
    } catch (err: unknown) {
      let message = "Terjadi kesalahan. Silakan coba lagi.";

      if (err && typeof err === "object" && "code" in err) {
        const errorCode = (err as { code: string; message: string }).code;

        switch (errorCode) {
          case "auth/email-already-in-use":
            message = "Email ini sudah terdaftar, silakan gunakan email lain.";
            break;
          case "auth/invalid-email":
            message = "Format email tidak valid.";
            break;
          case "auth/weak-password":
            message = "Password terlalu lemah. Gunakan minimal 8 karakter.";
            break;
          case "auth/network-request-failed":
            message = "Koneksi internet bermasalah. Coba lagi.";
            break;
          default:
            message = (err as unknown as { message: string }).message;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-5xl gap-6 lg:flex-row flex-col items-stretch">
      <Card className="flex-1 shadow-md border border-slate-200 max-w-lg dark:border-slate-800 flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Buat Akun
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Isi data diri Anda untuk memulai.
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-2" htmlFor="name">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2" htmlFor="repassword">
                Ulangi Password
              </Label>
              <Input
                id="repassword"
                type="password"
                placeholder="Ulangi masukkan password"
                value={repassword}
                onChange={(e) => setRepassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat
                  Akun...
                </>
              ) : (
                "Daftar"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary font-medium">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
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
          <Image src="/images/grid.svg" alt="grid" width={405} height={325} />
        </CardContent>
      </Card>
    </div>
  );
}
