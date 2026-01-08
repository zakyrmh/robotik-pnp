"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  getRecruitmentActivities,
  getDeletedRecruitmentActivities,
  calculateActivityStats,
  ActivityStats,
} from "@/lib/firebase/services/activity-service";
import { Activity } from "@/schemas/activities";
import { UserSystemRoles } from "@/schemas/users";

// =========================================================
// TYPES
// =========================================================

interface ActivityManagementContextType {
  // Loading states
  isLoading: boolean;
  isAuthorized: boolean;

  // Data
  activities: Activity[];
  stats: ActivityStats;
  roles: UserSystemRoles | null;
  deletedCount: number;

  // Actions
  refreshData: () => Promise<void>;
}

const ActivityManagementContext = createContext<
  ActivityManagementContextType | undefined
>(undefined);

// =========================================================
// PROVIDER
// =========================================================

interface ActivityManagementProviderProps {
  children: ReactNode;
}

export function ActivityManagementProvider({
  children,
}: ActivityManagementProviderProps) {
  // Get roles from parent DashboardContext (already loaded by layout)
  const { roles, isLoading: dashboardLoading } = useDashboard();

  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [stats, setStats] = useState<ActivityStats>({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  });

  // Check authorization (Recruiter or SuperAdmin)
  const isAuthorized =
    roles?.isRecruiter === true || roles?.isSuperAdmin === true;

  // Fetch activities once roles are loaded and authorized
  useEffect(() => {
    const fetchActivities = async () => {
      // Wait for dashboard context to finish loading
      if (dashboardLoading) return;

      // Check authorization
      if (!roles || (!roles.isRecruiter && !roles.isSuperAdmin)) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [data, deletedData] = await Promise.all([
          getRecruitmentActivities(),
          getDeletedRecruitmentActivities(),
        ]);
        setActivities(data);
        setStats(calculateActivityStats(data));
        setDeletedCount(deletedData.length);
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [roles, dashboardLoading]);

  const refreshData = async () => {
    if (!isAuthorized) return;

    try {
      setIsLoading(true);
      const [data, deletedData] = await Promise.all([
        getRecruitmentActivities(),
        getDeletedRecruitmentActivities(),
      ]);
      setActivities(data);
      setStats(calculateActivityStats(data));
      setDeletedCount(deletedData.length);
    } catch (err) {
      console.error("Error refreshing activities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: ActivityManagementContextType = {
    isLoading: dashboardLoading || isLoading,
    isAuthorized,
    activities,
    stats,
    roles,
    deletedCount,
    refreshData,
  };

  return (
    <ActivityManagementContext.Provider value={value}>
      {children}
    </ActivityManagementContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useActivityManagement() {
  const context = useContext(ActivityManagementContext);
  if (context === undefined) {
    throw new Error(
      "useActivityManagement must be used within an ActivityManagementProvider"
    );
  }
  return context;
}
