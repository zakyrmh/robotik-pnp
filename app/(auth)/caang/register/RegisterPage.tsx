"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle } from "lucide-react";

import RegisterForm from "@/app/(auth)/caang/register/RegisterForm";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Deadline: 20 September 2025, 23:59 WIB (UTC+7)
const DEADLINE = new Date("2025-09-24T12:00:00+07:00");

export default function RegisterPage() {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [mounted, setMounted] = useState(false);
  
const isDeadlinePassed = useMemo(() => {
  if (!mounted) return false;
  return new Date() > DEADLINE;
}, [mounted]);


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateCountdown = () => {
      const now = new Date();
      
      if (now > DEADLINE) {
        setTimeRemaining("expired");
        return;
      }

      const diff = DEADLINE.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let newTimeRemaining;
      if (days > 0) {
        newTimeRemaining = `${days} hari ${hours} jam lagi`;
      } else if (hours > 0) {
        newTimeRemaining = `${hours} jam ${minutes} menit lagi`;
      } else if (minutes > 0) {
        newTimeRemaining = `${minutes} menit ${seconds} detik lagi`;
      } else {
        newTimeRemaining = `${seconds} detik lagi`;
      }

      setTimeRemaining(newTimeRemaining);
    };

    // Initial check
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 lg:p-12">
        <div className="animate-pulse">Loading...</div>
        <ThemeToggle />
      </div>
    );
  }

  const ClosedRegistrationCard = () => (
    <div className="w-full max-w-md">
      <Card className="border-2 border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            Pendaftaran Ditutup
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Pendaftaran calon anggota{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                UKM Robotik PNP Angkatan 21
              </span>{" "}
              telah berakhir pada:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                20 September 2025
              </p>
              <p className="font-mono text-lg font-semibold">
                23:59 WIB
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Terima kasih atas antusiasme Anda!</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ActiveRegistrationContent = () => (
    <div className="flex flex-col items-center gap-4">
      {/* Countdown Timer - Only animate text content, not container */}
      <div className="text-center">
        <Card className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Pendaftaran berakhir dalam
              </span>
            </div>
            <p className="font-mono text-lg font-bold text-orange-600 dark:text-orange-400">
              {timeRemaining && timeRemaining !== "expired" ? timeRemaining : "Memuat..."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Form */}
        <RegisterForm />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6 lg:p-12">
      {isDeadlinePassed ? (
        <motion.div
          key="closed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ClosedRegistrationCard />
        </motion.div>
      ) : (
        <motion.div
          key="active"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ActiveRegistrationContent />
        </motion.div>
      )}
      <ThemeToggle />
    </div>
  );
}