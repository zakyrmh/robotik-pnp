"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { getRegistration } from "@/lib/firebase/services/registration-service";
import { Registration } from "@/types/registrations";
import UploadDocumentsForm from "./_components/UploadDocumentsForm";

export default function UploadDocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const regData = await getRegistration(currentUser.uid);
          setRegistration(regData);

          // Check if step 1 is verified
          const step1Verified =
            regData?.stepVerifications?.step1FormData?.verified ?? false;
          const step2Verified =
            regData?.stepVerifications?.step2Documents?.verified ?? false;

          if (!step1Verified) {
            toast.error("Silahkan lengkapi data diri terlebih dahulu");
            router.push("/dashboard/fill-data");
            return;
          }

          if (step2Verified) {
            setCanEdit(false);
            toast.info("Dokumen sudah diverifikasi, tidak dapat diubah");
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

  if (!canEdit) {
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
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0 dark:bg-green-900/30 dark:text-green-400">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800 mb-1 dark:text-green-300">
                  Dokumen Sudah Diverifikasi
                </h3>
                <p className="text-green-600 mb-4 dark:text-green-200">
                  Dokumen Anda telah diverifikasi oleh admin dan tidak dapat
                  diubah lagi.
                </p>
                <Link href="/dashboard">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Kembali ke Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
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
