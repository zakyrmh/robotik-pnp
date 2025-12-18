"use client";

import { useEffect, useState } from "react";
import RegisterForm from "./_components/register-form";
import { registrationStatus } from "@/lib/firebase/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSettings = async () => {
      const isOpen = await registrationStatus();
      setIsRegistrationOpen(isOpen);
      setLoading(false);
    };

    checkSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-800 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-200">Loading...</p>
        </div>
      </div>
    );
  }

  // Jika pendaftaran ditutup
  if (isRegistrationOpen === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-800 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-400">
              Pendaftaran Ditutup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              Mohon maaf, pendaftaran anggota baru saat ini sedang tidak aktif.
              Silakan hubungi administrator atau pantau informasi terbaru.
            </p>
            <Link href="/login">
              <Button
                variant="outline"
                className="mt-4 border-white/20 text-black hover:bg-white/10 hover:text-white bg-white"
              >
                Kembali ke Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-800 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
