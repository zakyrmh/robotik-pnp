"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const clear = () => {
    setEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    if (!email) {
      setError("Harap isi kolom email.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Email berhasil dikirim.");
      router.push("/login");
      clear();
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
          Reset Password
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Isi email Anda untuk reset password.
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

          {success && <p className="text-sm text-green-500">{success}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </>
            ) : (
              "Kirim Link Reset Password"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Masuk ke akun anda ?{" "}
          <Link href="/login" className="text-primary font-medium">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
