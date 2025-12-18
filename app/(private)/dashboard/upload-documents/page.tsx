"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { User as FirebaseUser } from "firebase/auth";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getRegistration } from "@/lib/firebase/services/registration-service";
import { Registration, RegistrationStatus } from "@/types/registrations";
import UploadDocumentsForm from "./_components/UploadDocumentsForm";

export default function UploadDocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const regData = await getRegistration(currentUser.uid);
          setRegistration(regData);

          if (!regData || regData.status === RegistrationStatus.DRAFT) {
            toast.error("Silahkan lengkapi data diri terlebih dahulu");
            router.push("/dashboard/fill-data");
            return;
          }
        } catch (error) {
          console.error(error);
          toast.error("Gagal memuat data");
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload Dokumen
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unggah foto dan dokumen pendukung lainnya untuk melanjutkan proses
            pendaftaran.
          </p>
        </div>

        <UploadDocumentsForm user={user} registration={registration} />
      </div>
    </div>
  );
}
