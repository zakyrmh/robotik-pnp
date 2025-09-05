"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { confirmPasswordReset, applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import Image from "next/image";

export default function ActionPage() {
  const router = useRouter();

  const [mode, setMode] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    setMode(searchParams.get("mode"));
    setOobCode(searchParams.get("oobCode"));

    if (!oobCode || !mode) return;

    if (mode === "verifyEmail") {
      setLoading(true);
      setError("");
      setSuccess("");
      applyActionCode(auth, oobCode)
        .then(() => {
          setSuccess("Email berhasil diverifikasi.");
          setError("");
        })
        .catch(() => {
          setError("Link verifikasi tidak valid atau sudah digunakan.");
          setSuccess("");
        })
        .finally(() => setLoading(false));
    }
  }, [mode, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return setError("Kode reset tidak valid");

    if (password.length < 8) return setError("Password minimal 8 karakter");
    if (password !== rePassword) return setError("Password tidak sama");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess("Password berhasil direset, silakan login.");
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg min-w-xs mx-auto shadow-md border">
      <CardHeader className="flex flex-col items-center space-y-2">
        {/* Logo */}
        <Image
          src="/images/logo.png"
          alt="Logo UKM Robotik PNP"
          width={64}
          height={64}
          className="rounded-full"
        />

        {/* Nama */}
        <h1 className="text-2xl font-bold text-center">UKM Robotik PNP</h1>

        {/* Keterangan */}
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          Sistem autentikasi akun anggota UKM Robotik Politeknik Negeri Padang
        </p>

        {/* Judul sesuai mode */}
        <CardTitle className="text-xl font-bold mt-4">
          {mode === "resetPassword" && "Reset Password"}
          {mode === "verifyEmail" && "Verifikasi Email"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {mode === "resetPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>Password Baru</Label>
              <Input
                className="mt-3"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Ulangi Password</Label>
              <Input
                className="mt-3"
                type="password"
                value={rePassword}
                onChange={(e) => setRePassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        )}

        {mode !== "resetPassword" && (
          <>
            {loading && <p className="text-sm">Memproses...</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && (
              <>
                <p className="text-green-500 text-sm">{success}</p>
                <p className="text-sm mt-3">
                  Silahkan kembali ke tab browser registerasi tadi.
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
