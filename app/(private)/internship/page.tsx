"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { internshipService } from "@/lib/firebase/services/internship-service";
import { RollingInternshipForm } from "./_components/RollingInternshipForm";
import { DepartmentInternshipForm } from "./_components/DepartmentInternshipForm";
import { InternshipLogbook } from "./_components/InternshipLogbook";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
  type RollingInternshipRegistration,
  type DepartmentInternshipRegistration,
} from "@/schemas/internship";

export default function InternshipPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(true);

  // State to track registration progress
  const [hasRolling, setHasRolling] = React.useState(false);
  const [hasDepartment, setHasDepartment] = React.useState(false);

  // Fetch internship status on load
  React.useEffect(() => {
    async function checkStatus() {
      if (!user) return; // Wait for auth
      try {
        const status = await internshipService.checkRegistrationStatus(
          user.uid,
        );
        setHasRolling(status.hasRolling);
        setHasDepartment(status.hasDepartment);
      } catch (error) {
        console.error("Error fetching internship status:", error);
        toast.error("Gagal memuat status magang.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (user) {
        checkStatus();
      } else {
        setLoading(false); // No user, stop loading (middleware handles protection usually)
      }
    }
  }, [user, authLoading]);

  // Handle Rolling Internship Submission
  const handleRollingSubmit = async (
    data: Omit<
      RollingInternshipRegistration,
      "id" | "userId" | "createdAt" | "updatedAt" | "submittedAt" | "status"
    >,
  ) => {
    if (!user) return;
    try {
      await internshipService.submitRollingInternship(user.uid, data);
      toast.success("Pendaftaran Magang Divisi Rolling berhasil!");
      setHasRolling(true);
      // Automatically show next form
    } catch (error) {
      console.error(error);
      throw error; // Re-throw to be caught by form
    }
  };

  // Handle Department Internship Submission
  const handleDepartmentSubmit = async (
    data: Omit<
      DepartmentInternshipRegistration,
      "id" | "userId" | "createdAt" | "updatedAt" | "submittedAt" | "status"
    >,
  ) => {
    if (!user) return;
    try {
      await internshipService.submitDepartmentInternship(user.uid, data);
      toast.success("Pendaftaran Magang Departemen berhasil!");
      setHasDepartment(true);
      // Automatically show logbook
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  // 1. If both registered, show Logbook
  if (hasRolling && hasDepartment) {
    return (
      <div className="container py-8">
        <InternshipLogbook />
      </div>
    );
  }

  // 2. If rolling not registered, show Rolling Form
  if (!hasRolling) {
    return (
      <div className="container py-8 flex flex-col items-center">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold">Pendaftaran Magang</h1>
          <p className="text-muted-foreground">
            Langkah 1 dari 2: Magang Divisi Rolling
          </p>
        </div>
        <RollingInternshipForm onSubmit={handleRollingSubmit} />
      </div>
    );
  }

  // 3. If rolling registered but department not, show Department Form
  if (hasRolling && !hasDepartment) {
    return (
      <div className="container py-8 flex flex-col items-center">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold">Pendaftaran Magang</h1>
          <p className="text-muted-foreground">
            Langkah 2 dari 2: Magang Departemen
          </p>
        </div>
        <DepartmentInternshipForm onSubmit={handleDepartmentSubmit} />
      </div>
    );
  }

  return null;
}
