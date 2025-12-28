import RegisterForm from "./_components/register-form";
import { registrationStatus } from "@/lib/firebase/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RegisterPage() {
  // Langsung panggil status di server side
  const isRegistrationOpen = await registrationStatus();

  // Jika pendaftaran ditutup
  if (!isRegistrationOpen) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}
