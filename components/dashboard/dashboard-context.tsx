"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserRolesAndAssignments } from "@/lib/firebase/services/user-service";
import { UserSystemRoles, UserAssignments } from "@/schemas/users";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// =========================================================
// TYPES
// =========================================================

interface UserProfile {
  fullName: string;
  photoUrl: string | null;
  email: string;
}

interface DashboardContextType {
  // Loading states
  isLoading: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  profileLoading: boolean;

  // Data
  roles: UserSystemRoles | null;
  assignments: UserAssignments | null;
  userProfile: UserProfile | null;
  isCaangVerified: boolean;

  // User from auth
  user: ReturnType<typeof useAuth>["user"];

  // Helper computed values based on roles + assignments
  hasCompetitionAccess: boolean;
  hasDepartmentAccess: boolean;
  hasStructuralAccess: boolean;
  isPresidium: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// =========================================================
// PROVIDER
// =========================================================

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { user, loading: authLoading } = useAuth();

  // State for Roles & Assignments
  const [roles, setRoles] = useState<UserSystemRoles | null>(null);
  const [assignments, setAssignments] = useState<UserAssignments | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // State for User Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // State for Caang Verification
  const [isCaangVerified, setIsCaangVerified] = useState(false);

  // 1. Fetch User Roles & Assignments
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      if (!user) {
        setRoles(null);
        setAssignments(null);
        setDataLoading(false);
        return;
      }

      try {
        setDataLoading(true);
        const data = await getUserRolesAndAssignments(user.uid);
        console.log("[DashboardContext] Fetched Roles:", data.roles);
        console.log(
          "[DashboardContext] Fetched Assignments:",
          data.assignments
        );
        setRoles(data.roles);
        setAssignments(data.assignments);
      } catch (err) {
        console.error("[DashboardContext] Failed to fetch user data:", err);
        setRoles(null);
        setAssignments(null);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // 2. Fetch User Profile (for UserInfo)
  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;

      if (!user) {
        setUserProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const ref = doc(db, "users_new", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setUserProfile({
            fullName: user.displayName || data.profile?.fullName || "User",
            photoUrl: data.profile?.photoUrl ?? null,
            email: user.email || "unknown@email.com",
          });
        } else {
          setUserProfile({
            fullName: user.displayName || "User",
            photoUrl: null,
            email: user.email || "unknown@email.com",
          });
        }
      } catch (error) {
        console.error("[DashboardContext] Failed to fetch profile:", error);
        setUserProfile({
          fullName: user.displayName || "User",
          photoUrl: null,
          email: user.email || "unknown@email.com",
        });
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  // 3. Check Caang Verification
  useEffect(() => {
    if (!roles || !user) {
      setIsCaangVerified(false);
      return;
    }

    if (roles.isCaang) {
      const checkVerification = async () => {
        try {
          const regRef = doc(db, "registrations", user.uid);
          const regSnap = await getDoc(regRef);

          if (regSnap.exists()) {
            const data = regSnap.data();
            const verified =
              data.status === "verified" &&
              data.verification?.verified === true;
            setIsCaangVerified(verified);
          } else {
            setIsCaangVerified(false);
          }
        } catch (error) {
          console.error(
            "[DashboardContext] Error checking verification:",
            error
          );
          setIsCaangVerified(false);
        }
      };

      checkVerification();
    } else {
      setIsCaangVerified(false);
    }
  }, [roles, user]);

  // =========================================================
  // COMPUTED VALUES
  // =========================================================

  // Apakah user memiliki akses kompetisi (tim KRI)
  const hasCompetitionAccess =
    roles?.isKRIMember === true &&
    assignments?.competitions !== undefined &&
    assignments.competitions.length > 0;

  // Apakah user memiliki akses departemen
  const hasDepartmentAccess =
    roles?.isOfficialMember === true &&
    assignments?.departments !== undefined &&
    assignments.departments.length > 0;

  // Apakah user memiliki jabatan struktural
  const hasStructuralAccess =
    roles?.isOfficialMember === true && assignments?.structural !== undefined;

  // Apakah user adalah presidium (ketua, wakil, sekretaris, bendahara)
  const isPresidium =
    hasStructuralAccess &&
    assignments?.structural !== undefined &&
    [
      "ketua_umum",
      "wakil_ketua_1",
      "wakil_ketua_2",
      "ketua_komdis",
      "ketua_recruitment",
      "sekretaris_1",
      "sekretaris_2",
      "bendahara_1",
      "bendahara_2",
    ].includes(assignments.structural.title);

  // Compute overall loading state
  const isLoading = authLoading || dataLoading || profileLoading;

  const value: DashboardContextType = {
    isLoading,
    authLoading,
    dataLoading,
    profileLoading,
    roles,
    assignments,
    userProfile,
    isCaangVerified,
    user,
    // Computed
    hasCompetitionAccess,
    hasDepartmentAccess,
    hasStructuralAccess,
    isPresidium,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
