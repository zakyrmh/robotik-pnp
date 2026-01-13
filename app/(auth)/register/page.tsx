"use client";

import { useEffect, useState } from "react";
import RegisterForm from "@/app/(auth)/register/_components/register-form";
import RegistrationClosed from "@/app/(auth)/register/_components/registration-closed";
import { getRecruitmentSettings } from "@/lib/firebase/services/settings-service";
import { RecruitmentSettings } from "@/schemas/recruitment-settings";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [settings, setSettings] = useState<RecruitmentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getRecruitmentSettings();
        setSettings(data);

        // Determine if open
        if (data && data.isRegistrationOpen) {
          const now = new Date();
          const openDate = data.schedule.openDate;
          const closeDate = data.schedule.closeDate;
          if (now >= openDate && now <= closeDate) {
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        } else {
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black px-4 sm:px-6 lg:px-8 py-12">
      {isOpen ? (
        <RegisterForm settings={settings} />
      ) : (
        <RegistrationClosed settings={settings} />
      )}
    </div>
  );
}
