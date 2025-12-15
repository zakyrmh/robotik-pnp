"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import StatusCard from "@/components/Dashboard/caang/StatusCard";
import { Registration } from "@/types/registrations";
import { User } from "@/types/users";
import StepRegistration from "@/components/Dashboard/caang/StepRegistration";
import StatusCardRegist from "@/components/Dashboard/caang/StatusCardRegist";
import QuickInfoCard from "@/components/Dashboard/caang/QuickInfoCards";
import ImportantInformation from "@/components/Dashboard/caang/ImportantInformation";
import ActivePhase from "@/components/Dashboard/caang/ActivePhase";
import NearbyActivities from "@/components/Dashboard/caang/NearbyActivities";
import QuickActions from "@/components/Dashboard/caang/QuickActions";
import RoadmapOR from "@/components/Dashboard/caang/RoadmapOR";
import Notification from "@/components/Dashboard/caang/Notification";
import Loading from "@/components/Loading";
import { RegistrationStatus } from "@/types/enum";

export default function CaangDashboard() {
  const [userAccount, setUser] = useState<User | null>(null);
  const [caang, setCaang] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    if (!user) return;

    const fetchData = async () => {
      try {
        const userRef = doc(db, "users_new", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          setUser(userData);
        } else {
          console.warn("Dokumen users tidak ditemukan!");
        }

        const caangRef = doc(db, "registrations", user.uid);
        const caangSnap = await getDoc(caangRef);

        if (caangSnap.exists()) {
          setCaang(caangSnap.data() as Registration);
        } else {
          console.warn("Dokumen registration tidak ditemukan untuk user ini!");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  // 1. Cek Akses User
  if (userAccount) {
    if (userAccount.deletedAt) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
              Akun Dinonaktifkan
            </h2>
            <p className="text-red-600 dark:text-red-300">
              Maaf, akun Anda tidak dapat mengakses halaman ini.
            </p>
          </div>
        </div>
      );
    }

    if (userAccount.blacklistInfo?.isBlacklisted) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
              Akun Diblokir
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              Akun Anda telah di-blacklist dan tidak dapat mengakses sistem.
            </p>
            {userAccount.blacklistInfo.reason && (
              <div className="bg-white p-4 rounded-xl border border-red-100 dark:bg-red-950/50 dark:border-red-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                  Alasan:
                </p>
                <p className="text-red-600 dark:text-red-300">
                  {userAccount.blacklistInfo.reason}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (!userAccount.isActive) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">
              Akun Tidak Aktif
            </h2>
            <p className="text-yellow-600 dark:text-yellow-300">
              Silakan hubungi admin untuk mengaktifkan akun Anda.
            </p>
          </div>
        </div>
      );
    }
  }

  // Helper untuk cek status
  const status = caang?.status;
  const payment = caang?.payment;
  const verification = caang?.verification;

  // Cek Rejection
  const isPaymentRejected =
    payment?.verified === false && Boolean(payment?.rejectionReason);
  const isVerificationRejected =
    verification?.verified === false && Boolean(verification?.rejectionReason);
  const isStatusRejected = status === RegistrationStatus.REJECTED;
  const isRejected =
    isPaymentRejected || isVerificationRejected || isStatusRejected;

  // Cek Training/Verified (Dashboard 3)
  const isVerified =
    (status === RegistrationStatus.VERIFIED && verification?.verified) || false;

  // Cek Waiting (Dashboard 2)
  const isWaiting =
    !isVerified &&
    !isRejected &&
    (status === RegistrationStatus.FORM_SUBMITTED ||
      status === RegistrationStatus.DOCUMENTS_UPLOADED ||
      status === RegistrationStatus.PAYMENT_PENDING);

  // DASHBOARD 3: PELATIHAN (Verified)
  if (isVerified) {
    return (
      <div className="min-h-screen lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <StatusCard caang={caang} />
            <ActivePhase />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <NearbyActivities />
              <QuickActions />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RoadmapOR />
              <Notification />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD 2: MENUNGGU VERIFIKASI
  if (isWaiting) {
    return (
      <div className="min-h-screen lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <StatusCardRegist user={userAccount} />

            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-blue-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-blue-900/30 dark:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white">
                Menunggu Verifikasi
              </h2>

              {status === RegistrationStatus.FORM_SUBMITTED && (
                <p className="text-gray-600 max-w-lg mx-auto dark:text-gray-300">
                  Data pendaftaran Anda telah disubmit. Tim kami sedang meninjau
                  form pendaftaran Anda.
                </p>
              )}

              {(status === RegistrationStatus.DOCUMENTS_UPLOADED ||
                status === RegistrationStatus.PAYMENT_PENDING) && (
                <p className="text-gray-600 max-w-lg mx-auto dark:text-gray-300">
                  Dokumen dan bukti pembayaran telah diterima. Mohon tunggu
                  proses verifikasi oleh admin.
                </p>
              )}

              <div className="mt-8 p-4 bg-blue-50 rounded-xl inline-block text-left dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 mb-2 dark:text-blue-300">
                  Status Saat Ini:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1 dark:text-blue-200">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Form Pendaftaran:{" "}
                    <span className="font-medium">Terkirim</span>
                  </li>
                  {(status === RegistrationStatus.DOCUMENTS_UPLOADED ||
                    status === RegistrationStatus.PAYMENT_PENDING) && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Dokumen & Pembayaran:{" "}
                      <span className="font-medium">Terkirim</span>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    Verifikasi Admin:{" "}
                    <span className="font-medium">Dalam Proses</span>
                  </li>
                </ul>
              </div>
            </div>

            <QuickInfoCard />
            <ImportantInformation />
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD 1: FORM PENDAFTARAN (Draft / Rejected / Need Revisions)
  return (
    <div className="min-h-screen lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <StatusCardRegist user={userAccount} />

          {/* Alert Rejection */}
          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 relative overflow-hidden dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start gap-4 z-10 relative">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-red-900/30 dark:text-red-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-1 dark:text-red-300">
                    Perlu Perbaikan Data
                  </h3>
                  <p className="text-red-600 mb-4 dark:text-red-200">
                    Terdapat data yang perlu Anda perbaiki sebelum dapat
                    melanjutkan.
                  </p>

                  <div className="space-y-2">
                    {isStatusRejected && (
                      <div className="bg-white/60 p-3 rounded-lg dark:bg-red-950/30">
                        <span className="font-semibold text-red-700 block text-sm dark:text-red-300">
                          Status Pendaftaran:
                        </span>
                        <p className="text-red-600 text-sm dark:text-red-200">
                          {verification?.rejectionReason ||
                            "Pendaftaran ditolak, silakan cek data Anda."}
                        </p>
                      </div>
                    )}

                    {isPaymentRejected && (
                      <div className="bg-white/60 p-3 rounded-lg dark:bg-red-950/30">
                        <span className="font-semibold text-red-700 block text-sm dark:text-red-300">
                          Pembayaran Ditolak:
                        </span>
                        <p className="text-red-600 text-sm dark:text-red-200">
                          {payment?.rejectionReason ||
                            "Bukti pembayaran tidak valid."}
                        </p>
                      </div>
                    )}

                    {isVerificationRejected && !isStatusRejected && (
                      <div className="bg-white/60 p-3 rounded-lg dark:bg-red-950/30">
                        <span className="font-semibold text-red-700 block text-sm dark:text-red-300">
                          Verifikasi Ditolak:
                        </span>
                        <p className="text-red-600 text-sm dark:text-red-200">
                          {verification?.rejectionReason ||
                            "Data verifikasi tidak valid."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <StepRegistration />
          <QuickInfoCard />
          <ImportantInformation />
        </div>
      </div>
    </div>
  );
}
