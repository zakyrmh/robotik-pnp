"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import VolunteerRegistrationForm from "@/app/(private)/events/caang/volunteer-mrc/VolunteerRegistration";
import RegistrationStatus from "@/app/(private)/events/caang/volunteer-mrc/RegistrationStatus";
import AlreadyRegistered from "@/app/(private)/events/caang/volunteer-mrc/AlreadyRegistered";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import { VolunteerData } from "@/types/volunteer-mrc";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

const REGISTRATION_START = new Date("2025-10-05T00:00:00+07:00");
const REGISTRATION_END = new Date("2025-10-20T23:59:59+07:00");

type FirestoreDateValue =
  | string
  | Date
  | { toDate: () => Date }
  | null
  | undefined;

export default function VolunteerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [registrationStatus, setRegistrationStatus] = useState<
    "not-started" | "open" | "closed"
  >("not-started");
  const [hasRegistered, setHasRegistered] = useState<boolean>(false);
  const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkRegistrationStatus = () => {
      const now = new Date();

      if (now < REGISTRATION_START) {
        setRegistrationStatus("not-started");
      } else if (now >= REGISTRATION_START && now <= REGISTRATION_END) {
        setRegistrationStatus("open");
      } else {
        setRegistrationStatus("closed");
      }
    };

    checkRegistrationStatus();
    const interval = setInterval(checkRegistrationStatus, 60000);

    const handleVisibility = () => {
      if (document.hidden) return;
      checkRegistrationStatus();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);

    return () => clearInterval(interval);
  }, []);

  const toISOStringSafe = (value: FirestoreDateValue): string => {
    if (!value) return new Date().toISOString();

    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof (value as { toDate: () => Date }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }

    return new Date().toISOString();
  };

  // Function to fetch user registration data
  const fetchUserRegistration = useCallback(async (userId: string) => {
    try {
      const volunteerRef = collection(db, "volunteer_mrc_ix");
      const q = query(volunteerRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();

        const volunteerDataObj: VolunteerData = {
          userId: data.userId || userId,
          pilihanPertama: data.pilihanPertama || "",
          pilihanKedua: data.pilihanKedua || "",
          bidangDitempatkan: data.bidangDitempatkan || null,
          alasanPilihanPertama: data.alasanPertama || null,
          alasanPilihanKedua: data.alasanKedua || null,
          timestamp: toISOStringSafe(data.timestamp),
          createdAt: toISOStringSafe(data.createdAt),
          commitmentDocUrl: null,
        };

        return volunteerDataObj;
      }

      return null;
    } catch (error) {
      console.error("Error fetching registration:", error);
      throw error;
    }
  }, []);

  // Check initial registration status
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchUserRegistration(user.uid);

        if (data) {
          setVolunteerData(data);
          setHasRegistered(true);
        } else {
          setHasRegistered(false);
          setVolunteerData(null);
        }
      } catch (error) {
        console.error("Error checking registration:", error);
        setHasRegistered(false);
        setVolunteerData(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRegistration();
  }, [user, fetchUserRegistration]);

  // Callback untuk handle success registration
  const handleRegistrationSuccess = async () => {
    if (!user?.uid) return;

    try {
      // Fetch updated data
      const data = await fetchUserRegistration(user.uid);

      if (data) {
        setVolunteerData(data);
        setHasRegistered(true);

        // Show success toast
        toast.success("Pendaftaran Berhasil!", {
          description:
            "Data Anda telah tersimpan. Hasil penempatan akan diumumkan pada 13 Oktober 2025 pukul 15.00 WIB.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error fetching registration data:", error);
      toast.error("Terjadi Kesalahan", {
        description: "Gagal memuat data pendaftaran. Silakan refresh halaman.",
        duration: 4000,
      });
    }
  };

  // Callback untuk handle error registration
  const handleRegistrationError = (message: string) => {
    toast.error("Pendaftaran Gagal", {
      description: message,
      duration: 4000,
    });
  };

  const shareActivity = () => {
    if (navigator.share) {
      navigator.share({
        title: "Volunteer MRC IX",
        text: "Volunteer Minangkabau Robot Contest IX 2025",
        url: window.location.href,
      });
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() =>
          toast.success("Link Disalin", {
            description: "Link telah disalin ke clipboard!",
          })
        )
        .catch(() => toast.error("Gagal menyalin link"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Detail Aktivitas
            </h1>
          </div>
          <button
            onClick={shareActivity}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {hasRegistered && volunteerData ? (
        // User already registered - show registration details
        <AlreadyRegistered data={volunteerData} />
      ) : (
        // User not registered yet
        <>
          {registrationStatus === "open" ? (
            // Registration is open - show form
            <VolunteerRegistrationForm
              onRegistrationSuccess={handleRegistrationSuccess}
              onRegistrationError={handleRegistrationError}
            />
          ) : (
            // Registration not started or closed
            <RegistrationStatus status={registrationStatus} />
          )}
        </>
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}
