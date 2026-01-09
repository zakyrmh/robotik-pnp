"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Settings, UserCircle, KeyRound, AlertTriangle } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProfileImage } from "@/components/ui/storage-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/lib/firebase/services/profile-service";
import { User } from "@/schemas/users";
import { useUnsavedChanges } from "@/components/unsaved-changes-context";

import { ProfileForm, ProfileFormSkeleton, AccountForm } from "./_components";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function getRoleBadges(roles: User["roles"]): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}[] {
  const badges: {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }[] = [];

  if (roles?.isSuperAdmin)
    badges.push({ label: "Super Admin", variant: "destructive" });
  if (roles?.isKestari) badges.push({ label: "Kestari", variant: "default" });
  if (roles?.isKomdis) badges.push({ label: "Komdis", variant: "default" });
  if (roles?.isRecruiter)
    badges.push({ label: "Recruiter", variant: "default" });
  if (roles?.isKRIMember)
    badges.push({ label: "Anggota KRI", variant: "secondary" });
  if (roles?.isOfficialMember)
    badges.push({ label: "Anggota Resmi", variant: "secondary" });
  if (roles?.isCaang) badges.push({ label: "Caang", variant: "outline" });
  if (roles?.isAlumni) badges.push({ label: "Alumni", variant: "outline" });

  return badges;
}

// =========================================================
// PAGE SKELETON
// =========================================================

function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-80 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>

      <Separator />

      {/* Profile Card Skeleton */}
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="text-center sm:text-left space-y-2">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="flex gap-2 justify-center sm:justify-start">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />

      {/* Form Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <ProfileFormSkeleton />
      </div>
    </div>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Use global unsaved changes context
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();

  // Local dialog state for tab switching
  const [showTabDialog, setShowTabDialog] = useState(false);
  const pendingTabRef = useRef<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;

      setIsLoading(true);
      try {
        const { user: fetchedUser } = await getUserProfile(user.uid);
        setUserData(fetchedUser);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchUserData();
    }
  }, [user, authLoading]);

  // Handle beforeunload event for browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Clear unsaved changes on unmount
  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

  // Handle profile form dirty state change
  const handleProfileDirtyChange = useCallback(
    (isDirty: boolean) => {
      setHasUnsavedChanges(isDirty);
    },
    [setHasUnsavedChanges]
  );

  // Handle tab change with unsaved changes check
  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges && newTab !== activeTab) {
      pendingTabRef.current = newTab;
      setShowTabDialog(true);
    } else {
      setActiveTab(newTab);
    }
  };

  // Confirm leaving without saving (for tab change)
  const handleConfirmTabLeave = () => {
    if (pendingTabRef.current) {
      setActiveTab(pendingTabRef.current);
      pendingTabRef.current = null;
    }
    setHasUnsavedChanges(false);
    setShowTabDialog(false);
  };

  // Cancel leaving
  const handleCancelTabLeave = () => {
    pendingTabRef.current = null;
    setShowTabDialog(false);
  };

  // Refresh data after profile update
  const handleProfileUpdate = async () => {
    if (!user?.uid) return;

    const { user: fetchedUser } = await getUserProfile(user.uid);
    setUserData(fetchedUser);
    setHasUnsavedChanges(false);
  };

  // Show loading state
  if (authLoading || isLoading) {
    return <SettingsPageSkeleton />;
  }

  // No user data
  if (!userData || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
          <Settings className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Data tidak ditemukan
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Tidak dapat memuat data profil Anda. Silakan coba refresh halaman.
        </p>
      </div>
    );
  }

  const roleBadges = getRoleBadges(userData.roles);

  return (
    <>
      {/* Tab Switch Unsaved Changes Dialog */}
      <AlertDialog open={showTabDialog} onOpenChange={setShowTabDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Perubahan Belum Disimpan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda memiliki perubahan yang belum disimpan. Jika Anda berpindah
              tab, perubahan akan hilang. Apakah Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTabLeave}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTabLeave}
              className="bg-red-600 hover:bg-red-700"
            >
              Tinggalkan Tanpa Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Settings className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Pengaturan Akun
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 rounded-full">
                  Belum Disimpan
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola informasi profil dan keamanan akun Anda
            </p>
          </div>
        </div>

        <Separator />

        {/* Profile Summary Card */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ProfileImage
              storagePath={userData.profile?.photoUrl}
              fallbackName={userData.profile?.fullName}
              size="lg"
              className="ring-4 ring-white dark:ring-slate-800 shadow-lg"
            />

            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {userData.profile?.fullName || "Nama belum diatur"}
              </h2>
              <p className="text-muted-foreground">{userData.email}</p>
              {roleBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                  {roleBadges.map((badge, index) => (
                    <Badge key={index} variant={badge.variant}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              <span>Data Diri</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              <span>Akun</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Profile Form */}
          <TabsContent value="profile" className="mt-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <ProfileForm
                userData={userData}
                uid={user.uid}
                onSuccess={handleProfileUpdate}
                onDirtyChange={handleProfileDirtyChange}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Account Form */}
          <TabsContent value="account" className="mt-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <AccountForm currentEmail={userData.email} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
