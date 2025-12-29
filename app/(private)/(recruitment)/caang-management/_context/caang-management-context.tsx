"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserRoles } from "@/lib/firebase/services/user-service";
import {
  getAllCaangUsers,
  calculateCaangStats,
  CaangData,
  CaangStats,
} from "@/lib/firebase/services/caang-service";
import { UserSystemRoles } from "@/schemas/users";

// =========================================================
// TYPES
// =========================================================

interface CaangManagementContextType {
  // Loading states
  isLoading: boolean;
  isAuthorized: boolean;

  // Data
  caangList: CaangData[];
  stats: CaangStats;
  roles: UserSystemRoles | null;

  // Actions
  refreshData: () => Promise<void>;
}

const CaangManagementContext = createContext<
  CaangManagementContextType | undefined
>(undefined);

// =========================================================
// PROVIDER
// =========================================================

interface CaangManagementProviderProps {
  children: ReactNode;
}

export function CaangManagementProvider({
  children,
}: CaangManagementProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<UserSystemRoles | null>(null);
  const [caangList, setCaangList] = useState<CaangData[]>([]);
  const [stats, setStats] = useState<CaangStats>({
    total: 0,
    pendingVerification: 0,
    verified: 0,
    blacklisted: 0,
  });

  // Check authorization
  const isAuthorized =
    roles?.isRecruiter === true || roles?.isSuperAdmin === true;

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      if (authLoading) return;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userRoles = await getUserRoles(user.uid);
        setRoles(userRoles);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };

    fetchRoles();
  }, [user, authLoading]);

  // Fetch caang data once authorized
  useEffect(() => {
    const fetchCaangData = async () => {
      if (!roles) return;

      // Check authorization
      if (!roles.isRecruiter && !roles.isSuperAdmin) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getAllCaangUsers();
        setCaangList(data);
        setStats(calculateCaangStats(data));
      } catch (err) {
        console.error("Error fetching caang data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaangData();
  }, [roles]);

  const refreshData = async () => {
    if (!isAuthorized) return;

    try {
      setIsLoading(true);
      const data = await getAllCaangUsers();
      setCaangList(data);
      setStats(calculateCaangStats(data));
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: CaangManagementContextType = {
    isLoading: authLoading || isLoading,
    isAuthorized,
    caangList,
    stats,
    roles,
    refreshData,
  };

  return (
    <CaangManagementContext.Provider value={value}>
      {children}
    </CaangManagementContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useCaangManagement() {
  const context = useContext(CaangManagementContext);
  if (context === undefined) {
    throw new Error(
      "useCaangManagement must be used within a CaangManagementProvider"
    );
  }
  return context;
}
