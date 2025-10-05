"use client";

import { useEffect, useMemo, useState } from "react";
import VolunteerRegistrationForm from "@/app/(private)/events/caang/volunteer-mrc/VolunteerRegistration";
import RegistrationStatus from "@/app/(private)/events/caang/volunteer-mrc/RegistrationStatus";

export default function VolunteerPage() {
  const [registrationStatus, setRegistrationStatus] = useState<
    "not-started" | "open" | "closed"
  >("not-started");

  // Tanggal pendaftaran
  const REGISTRATION_START = useMemo(
    () => new Date("2025-10-05T00:00:00+07:00"),
    []
  ); // 6 Oktober 2025 pukul 00:00 WIB
  const REGISTRATION_END = useMemo(
    () => new Date("2025-10-20T23:59:59+07:00"),
    []
  ); // 11 Oktober 2025 pukul 23:59 WIB

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

    // Check status saat pertama kali load
    checkRegistrationStatus();

    // Check status setiap 1 menit untuk update real-time
    const interval = setInterval(checkRegistrationStatus, 60000);

    return () => clearInterval(interval);
  }, [REGISTRATION_END, REGISTRATION_START]);

  return (
    <>
      {registrationStatus === "open" ? (
        <VolunteerRegistrationForm />
      ) : (
        <RegistrationStatus status={registrationStatus} />
      )}
    </>
  );
}
