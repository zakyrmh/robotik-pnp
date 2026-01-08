"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useMemo,
} from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { getRecruitmentActivities } from "@/lib/firebase/services/activity-service";
import {
  getAllRecruitmentAttendances,
  getCaangUsers,
  getUsersWithAttendanceStatus,
  buildAttendanceSummary,
  AttendanceStats,
  CaangUserData,
  CaangAttendanceSummary,
  UserAttendanceData,
} from "@/lib/firebase/services/attendance-service";
import { Activity } from "@/schemas/activities";
import { Attendance } from "@/schemas/attendances";
import { UserSystemRoles } from "@/schemas/users";

// =========================================================
// TYPES
// =========================================================

interface AttendanceManagementContextType {
  // Loading states
  isLoading: boolean;
  isAuthorized: boolean;

  // Data
  activities: Activity[];
  allAttendances: Attendance[];
  usersWithAttendance: UserAttendanceData[]; // NEW: All users with their attendance status
  stats: AttendanceStats;
  roles: UserSystemRoles | null;
  selectedActivityId: string;
  orPeriods: string[];
  caangUsers: CaangUserData[];
  summaries: CaangAttendanceSummary[];

  // Actions
  setSelectedActivityId: (id: string) => void;
  refreshData: () => Promise<void>;
}

const AttendanceManagementContext = createContext<
  AttendanceManagementContextType | undefined
>(undefined);

// =========================================================
// PROVIDER
// =========================================================

interface AttendanceManagementProviderProps {
  children: ReactNode;
}

export function AttendanceManagementProvider({
  children,
}: AttendanceManagementProviderProps) {
  // Get roles from parent DashboardContext
  const { roles, isLoading: dashboardLoading } = useDashboard();

  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allAttendances, setAllAttendances] = useState<Attendance[]>([]);
  const [caangUsers, setCaangUsers] = useState<CaangUserData[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");

  // Check authorization (Recruiter or SuperAdmin)
  const isAuthorized =
    roles?.isRecruiter === true || roles?.isSuperAdmin === true;

  // Extract unique OR periods from activities
  const orPeriods = Array.from(
    new Set(activities.map((a) => a.orPeriod).filter(Boolean))
  )
    .sort()
    .reverse() as string[];

  // Get all users with their attendance status for selected activity
  // This is the main data for "Daftar Kehadiran" tab
  const usersWithAttendance = useMemo(() => {
    if (!selectedActivityId || caangUsers.length === 0) {
      return [];
    }
    return getUsersWithAttendanceStatus(
      caangUsers,
      allAttendances,
      selectedActivityId
    );
  }, [caangUsers, allAttendances, selectedActivityId]);

  // Calculate stats from usersWithAttendance
  const stats = useMemo((): AttendanceStats => {
    if (usersWithAttendance.length === 0) {
      return {
        totalCaang: caangUsers.length,
        present: 0,
        late: 0,
        excused: 0,
        sick: 0,
        absent: caangUsers.length, // All absent if no activity selected
      };
    }

    const result: AttendanceStats = {
      totalCaang: usersWithAttendance.length,
      present: 0,
      late: 0,
      excused: 0,
      sick: 0,
      absent: 0,
    };

    usersWithAttendance.forEach((u) => {
      switch (u.status) {
        case "present":
          result.present++;
          break;
        case "late":
          result.late++;
          break;
        case "excused":
          result.excused++;
          break;
        case "sick":
          result.sick++;
          break;
        case "absent":
        case "pending_approval":
        default:
          result.absent++;
          break;
      }
    });

    return result;
  }, [usersWithAttendance, caangUsers.length]);

  // Build summaries for recap table
  const summaries = useMemo(() => {
    return buildAttendanceSummary(allAttendances, activities, caangUsers);
  }, [allAttendances, activities, caangUsers]);

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      if (dashboardLoading) return;

      if (!roles || (!roles.isRecruiter && !roles.isSuperAdmin)) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch activities, all attendances, and caang users in parallel
        const [activitiesData, allAttendancesData, usersData] =
          await Promise.all([
            getRecruitmentActivities(),
            getAllRecruitmentAttendances(),
            getCaangUsers(),
          ]);

        setActivities(activitiesData);
        setAllAttendances(allAttendancesData);
        setCaangUsers(usersData);

        // Auto-select the first (most recent) activity
        if (activitiesData.length > 0) {
          setSelectedActivityId(activitiesData[0].id);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [roles, dashboardLoading]);

  const refreshData = async () => {
    if (!isAuthorized) return;

    try {
      setIsLoading(true);

      // Refresh all data
      const [activitiesData, allAttendancesData, usersData] = await Promise.all(
        [
          getRecruitmentActivities(),
          getAllRecruitmentAttendances(),
          getCaangUsers(),
        ]
      );

      setActivities(activitiesData);
      setAllAttendances(allAttendancesData);
      setCaangUsers(usersData);
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AttendanceManagementContextType = {
    isLoading: dashboardLoading || isLoading,
    isAuthorized,
    activities,
    allAttendances,
    usersWithAttendance,
    stats,
    roles,
    selectedActivityId,
    orPeriods,
    caangUsers,
    summaries,
    setSelectedActivityId,
    refreshData,
  };

  return (
    <AttendanceManagementContext.Provider value={value}>
      {children}
    </AttendanceManagementContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useAttendanceManagement() {
  const context = useContext(AttendanceManagementContext);
  if (context === undefined) {
    throw new Error(
      "useAttendanceManagement must be used within an AttendanceManagementProvider"
    );
  }
  return context;
}
