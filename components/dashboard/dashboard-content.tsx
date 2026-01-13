"use client";

import { ReactNode } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {} from "@/components/dashboard/cards";

interface DashboardContentProps {
  children: ReactNode;
  // Parallel Slot Props
  kri: ReactNode;
  official: ReactNode;
  komdis: ReactNode;
  recruitment: ReactNode;
  management: ReactNode;
  overview: ReactNode;
}

export function DashboardContent({
  children,
  overview,
  management,
  kri,
  official,
  komdis,
  recruitment,
}: DashboardContentProps) {
  const {
    roles,
    userProfile,
    hasCompetitionAccess,
    hasDepartmentAccess,
    isPresidium,
  } = useDashboard();

  const userName = userProfile?.fullName || "User";

  // Check if user is alumni (no access)
  if (roles?.isAlumni) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-2xl max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Selamat Datang, Alumni!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Terima kasih atas kontribusimu di UKM Robotik PNP. Sebagai alumni,
            akses ke sistem ini telah dibatasi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {userName}
        </p>
      </div>

      {/* OVERVIEW SECTION (Always Top) */}
      <div className="mb-6 w-full">{overview}</div>

      {/* MANAGEMENT PANEL (Full Width - for Admin, Kestari, Presidium) */}
      {(roles?.isSuperAdmin || roles?.isKestari || isPresidium) && (
        <div className="mb-6 w-full">{management}</div>
      )}

      {/* DYNAMIC GRID BASED ON ROLES & ASSIGNMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* KRI Card - untuk anggota tim kompetisi */}
        {hasCompetitionAccess && <div className="col-span-1">{kri}</div>}

        {/* Official Card - untuk anggota dengan departemen/struktural */}
        {(hasDepartmentAccess || isPresidium) && (
          <div className="col-span-1">{official}</div>
        )}

        {/* Komdis Card - untuk komisi disiplin */}
        {(roles?.isKomdis || roles?.isSuperAdmin) && (
          <div className="col-span-1">{komdis}</div>
        )}

        {/* Recruitment Card - untuk panitia OR */}
        {(roles?.isRecruiter || roles?.isSuperAdmin) && (
          <div className="col-span-1">{recruitment}</div>
        )}
      </div>

      {/* DEFAULT CHILDREN (if any) */}
      {children && <div className="mt-8">{children}</div>}
    </>
  );
}
