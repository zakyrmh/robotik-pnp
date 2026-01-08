import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Activity,
  ActivitySchema,
  ActivityType,
  ActivityStatus,
} from "@/schemas/activities";

// =========================================================
// TYPES
// =========================================================

export interface ActivityStats {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

// =========================================================
// SERVICE FUNCTIONS
// =========================================================

/**
 * Fetch all activities by type (recruitment or internal)
 */
export async function getActivitiesByType(
  type: ActivityType
): Promise<Activity[]> {
  try {
    const activitiesRef = collection(db, "activities");
    const q = query(
      activitiesRef,
      where("type", "==", type),
      where("isActive", "==", true),
      orderBy("startDateTime", "desc")
    );

    const snapshot = await getDocs(q);
    const activities: Activity[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const parsed = ActivitySchema.safeParse({
        id: doc.id,
        ...data,
      });

      if (parsed.success) {
        activities.push(parsed.data);
      } else {
        console.warn(
          `[activity-service] Invalid activity data for ${doc.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return activities;
  } catch (error) {
    console.error("[activity-service] Error fetching activities:", error);
    throw error;
  }
}

/**
 * Get recruitment activities
 */
export async function getRecruitmentActivities(): Promise<Activity[]> {
  return getActivitiesByType("recruitment");
}

/**
 * Get internal activities
 */
export async function getInternalActivities(): Promise<Activity[]> {
  return getActivitiesByType("internal");
}

/**
 * Calculate activity statistics
 */
export function calculateActivityStats(activities: Activity[]): ActivityStats {
  const stats: ActivityStats = {
    total: activities.length,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  };

  activities.forEach((activity) => {
    switch (activity.status) {
      case "upcoming":
        stats.upcoming++;
        break;
      case "ongoing":
        stats.ongoing++;
        break;
      case "completed":
        stats.completed++;
        break;
      case "cancelled":
        stats.cancelled++;
        break;
    }
  });

  return stats;
}

/**
 * Format date for display
 */
export function formatActivityDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format time for display
 */
export function formatActivityTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Get status label in Indonesian
 */
export function getStatusLabel(status: ActivityStatus): string {
  const labels: Record<ActivityStatus, string> = {
    upcoming: "Akan Datang",
    ongoing: "Berlangsung",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return labels[status];
}

/**
 * Get mode label in Indonesian
 */
export function getModeLabel(mode: "online" | "offline" | "hybrid"): string {
  const labels = {
    online: "Online",
    offline: "Offline",
    hybrid: "Hybrid",
  };
  return labels[mode];
}

// =========================================================
// CREATE & UPDATE FUNCTIONS
// =========================================================

import {
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { CreateActivityInput, UpdateActivityInput } from "@/schemas/activities";

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Generate unique ID for activity
 */
function generateActivityId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `act_${timestamp}_${randomStr}`;
}

/**
 * Create a new activity
 */
export async function createActivity(
  input: CreateActivityInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const activityId = generateActivityId();
    const slug = generateSlug(input.title);
    const now = Timestamp.now();

    const activityData = {
      id: activityId,
      slug: `${slug}-${activityId.slice(-6)}`,
      type: input.type,
      title: input.title,
      description: input.description || "",
      orPeriod: input.orPeriod || null,
      startDateTime: Timestamp.fromDate(input.startDateTime),
      endDateTime: Timestamp.fromDate(input.endDateTime),
      mode: input.mode,
      location: input.location || null,
      onlineLink: input.onlineLink || null,
      attendanceEnabled: input.attendanceEnabled,
      attendanceOpenTime: null,
      attendanceCloseTime: null,
      lateTolerance: input.lateTolerance || 15,
      totalParticipants: 0,
      attendedCount: 0,
      absentCount: 0,
      status: input.status,
      isVisible: true,
      isActive: true,
      deletedAt: null,
      deletedBy: null,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, "activities", activityId);
    await setDoc(docRef, activityData);

    console.log("[activity-service] Created activity:", activityId);
    return { success: true, id: activityId };
  } catch (error) {
    console.error("[activity-service] Error creating activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat aktivitas",
    };
  }
}

/**
 * Update an existing activity
 */
export async function updateActivity(
  input: UpdateActivityInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id, ...updateData } = input;
    const docRef = doc(db, "activities", id);

    // Prepare update object
    const updateObj: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    // Only include defined fields
    if (updateData.title !== undefined) {
      updateObj.title = updateData.title;
      updateObj.slug = `${generateSlug(updateData.title)}-${id.slice(-6)}`;
    }
    if (updateData.description !== undefined) {
      updateObj.description = updateData.description;
    }
    if (updateData.orPeriod !== undefined) {
      updateObj.orPeriod = updateData.orPeriod || null;
    }
    if (updateData.startDateTime !== undefined) {
      updateObj.startDateTime = Timestamp.fromDate(updateData.startDateTime);
    }
    if (updateData.endDateTime !== undefined) {
      updateObj.endDateTime = Timestamp.fromDate(updateData.endDateTime);
    }
    if (updateData.mode !== undefined) {
      updateObj.mode = updateData.mode;
    }
    if (updateData.location !== undefined) {
      updateObj.location = updateData.location || null;
    }
    if (updateData.onlineLink !== undefined) {
      updateObj.onlineLink = updateData.onlineLink || null;
    }
    if (updateData.attendanceEnabled !== undefined) {
      updateObj.attendanceEnabled = updateData.attendanceEnabled;
    }
    if (updateData.lateTolerance !== undefined) {
      updateObj.lateTolerance = updateData.lateTolerance;
    }
    if (updateData.status !== undefined) {
      updateObj.status = updateData.status;
    }

    await updateDoc(docRef, updateObj);

    console.log("[activity-service] Updated activity:", id);
    return { success: true };
  } catch (error) {
    console.error("[activity-service] Error updating activity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengupdate aktivitas",
    };
  }
}

/**
 * Helper to convert Activity to form values
 */
export function activityToFormValues(activity: Activity): {
  title: string;
  description: string;
  orPeriod: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  mode: "online" | "offline" | "hybrid";
  location: string;
  onlineLink: string;
  attendanceEnabled: boolean;
  lateTolerance: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
} {
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  return {
    title: activity.title,
    description: activity.description || "",
    orPeriod: activity.orPeriod || "",
    startDate: formatDate(activity.startDateTime),
    startTime: formatTime(activity.startDateTime),
    endDate: formatDate(activity.endDateTime),
    endTime: formatTime(activity.endDateTime),
    mode: activity.mode,
    location: activity.location || "",
    onlineLink: activity.onlineLink || "",
    attendanceEnabled: activity.attendanceEnabled,
    lateTolerance: activity.lateTolerance || 15,
    status: activity.status,
  };
}

/**
 * Helper to parse form values to Date objects
 */
export function parseFormDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

/**
 * Duplicate an existing activity
 */
export async function duplicateActivity(
  activity: Activity,
  createdBy: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const activityId = generateActivityId();
    const slug = generateSlug(activity.title);
    const now = Timestamp.now();

    const activityData = {
      id: activityId,
      slug: `${slug}-${activityId.slice(-6)}`,
      type: activity.type,
      title: `${activity.title} (Salinan)`,
      description: activity.description || "",
      orPeriod: activity.orPeriod || null,
      startDateTime: Timestamp.fromDate(activity.startDateTime),
      endDateTime: Timestamp.fromDate(activity.endDateTime),
      mode: activity.mode,
      location: activity.location || null,
      onlineLink: activity.onlineLink || null,
      attendanceEnabled: activity.attendanceEnabled,
      attendanceOpenTime: null,
      attendanceCloseTime: null,
      lateTolerance: activity.lateTolerance || 15,
      totalParticipants: 0,
      attendedCount: 0,
      absentCount: 0,
      status: "upcoming" as const, // Reset status to upcoming
      isVisible: true,
      isActive: true,
      deletedAt: null,
      deletedBy: null,
      createdBy: createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, "activities", activityId);
    await setDoc(docRef, activityData);

    console.log("[activity-service] Duplicated activity:", activityId);
    return { success: true, id: activityId };
  } catch (error) {
    console.error("[activity-service] Error duplicating activity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menduplikasi aktivitas",
    };
  }
}

/**
 * Soft delete an activity
 */
export async function deleteActivity(
  activityId: string,
  deletedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "activities", activityId);

    await updateDoc(docRef, {
      isActive: false,
      deletedAt: serverTimestamp(),
      deletedBy: deletedBy,
      updatedAt: serverTimestamp(),
    });

    console.log("[activity-service] Deleted activity:", activityId);
    return { success: true };
  } catch (error) {
    console.error("[activity-service] Error deleting activity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menghapus aktivitas",
    };
  }
}

// =========================================================
// TRASH MANAGEMENT FUNCTIONS
// =========================================================

import { deleteDoc } from "firebase/firestore";

/**
 * Get all deleted activities by type
 */
export async function getDeletedActivitiesByType(
  type: ActivityType
): Promise<Activity[]> {
  try {
    const activitiesRef = collection(db, "activities");
    const q = query(
      activitiesRef,
      where("type", "==", type),
      where("isActive", "==", false),
      orderBy("deletedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const activities: Activity[] = [];

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const parsed = ActivitySchema.safeParse({
        id: docSnapshot.id,
        ...data,
      });

      if (parsed.success) {
        activities.push(parsed.data);
      } else {
        console.warn(
          `[activity-service] Invalid deleted activity data for ${docSnapshot.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return activities;
  } catch (error) {
    console.error(
      "[activity-service] Error fetching deleted activities:",
      error
    );
    throw error;
  }
}

/**
 * Get deleted recruitment activities
 */
export async function getDeletedRecruitmentActivities(): Promise<Activity[]> {
  return getDeletedActivitiesByType("recruitment");
}

/**
 * Restore a deleted activity
 */
export async function restoreActivity(
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "activities", activityId);

    await updateDoc(docRef, {
      isActive: true,
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });

    console.log("[activity-service] Restored activity:", activityId);
    return { success: true };
  } catch (error) {
    console.error("[activity-service] Error restoring activity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memulihkan aktivitas",
    };
  }
}

/**
 * Permanently delete an activity (cannot be undone)
 */
export async function permanentDeleteActivity(
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "activities", activityId);
    await deleteDoc(docRef);

    console.log("[activity-service] Permanently deleted activity:", activityId);
    return { success: true };
  } catch (error) {
    console.error(
      "[activity-service] Error permanently deleting activity:",
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menghapus aktivitas secara permanen",
    };
  }
}
