"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clear = () => {
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Harap isi semua kolom.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Email Anda belum diverifikasi. Silakan cek inbox Anda.");
        setLoading(false);
        return;
      }

      clear();
      router.push("/dashboard");
    } catch (err: unknown) {
      let message = "Terjadi kesalahan. Silakan coba lagi.";

      if (err && typeof err === "object" && "code" in err) {
        const errorCode = (err as { code: string; message: string }).code;

        switch (errorCode) {
          case "auth/invalid-credential":
            message = "Email atau kata sandi salah. Coba lagi.";
            break;
          case "auth/user-not-found":
            message = "Email tidak ditemukan. Silakan daftar terlebih dahulu.";
            break;
          case "auth/wrong-password":
            message = "Kata sandi salah. Coba lagi.";
            break;
          case "auth/invalid-email":
            message = "Format email tidak valid.";
            break;
          case "auth/too-many-requests":
            message =
              "Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.";
            break;
          case "auth/network-request-failed":
            message = "Koneksi internet bermasalah. Silakan coba lagi.";
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
    <Card className="flex-1 shadow-md border border-slate-200 max-w-lg dark:border-slate-800 flex flex-col">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Login
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Isi data Anda untuk masuk.
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Masuk...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Belum memiliki akun?{" "}
          <Link href="/caang/register" className="text-primary font-medium">
            Daftar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
