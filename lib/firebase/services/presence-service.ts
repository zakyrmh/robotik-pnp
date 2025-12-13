
import { getActivities } from "../activities";
import { getAttendancesByUser, calculatePoints } from "../attendances";
import { getRegistrationById } from "../registrations";
import { Activity } from "@/types/activities";
import { Attendance } from "@/types/attendances";
import { AttendanceStatus } from "@/types/enum";

export interface PresenceStats {
  totalActivities: number;
  attended: number;
  absent: number;
  late: number;
  excused: number; // Izin/Sakit
  attendanceRate: number;
  totalPoints: number;
}

export interface ActivityWithAttendance {
  activity: Activity;
  attendance?: Attendance;
}

export async function getUserPresenceData(userId: string) {
  try {
    // 1. Get User Registration to find orPeriod
    const registration = await getRegistrationById(userId);
    
    if (!registration) {
      throw new Error("User registration not found");
    }

    const { orPeriod } = registration;

    if (!orPeriod) {
        // Handle case where orPeriod might be missing or empty?
        // For now, assume it's critical.
         console.warn(`User ${userId} has no orPeriod assigned.`);
    }

    // 2. Get All Activities for this Period
    // We want ALL activities, so we don't filter by status (unless strictly required, but usually we want past ones too)
    const activities = await getActivities({ orPeriod });

    // 3. Get User Attendances
    const attendances = await getAttendancesByUser(userId);

    // 4. Map Activities with their Attendance status
    // We want to show ALL activities. If attendance exists, show status. Else show 'Absent' (or 'Upcoming' if in future).
    
    const activitiesWithAttendance: ActivityWithAttendance[] = activities.map(activity => {
      const attendance = attendances.find(a => a.activityId === activity.id);
      return {
        activity,
        attendance
      };
    });

    // 5. Calculate Stats
    // Only count activities that are NOT upcoming for stats (completed/ongoing/past due)
    // Actually, "Total Activities" usually means "Activities passing so far" or "All planned"?
    // Let's count "Past/Completed" activities for the rate denominator.
    
    const now = new Date();
    
    // Filter activities that have happened (start time < now) or completed status AND have attendance enabled
    const pastActivities = activitiesWithAttendance.filter(({ activity }) => {
        if (!activity.attendanceEnabled) return false;

        // Check if activity is effectively "past" or "active" enough to require attendance
        // If status is 'upcoming', usually we don't count it as "absent" yet.
        return activity.status === 'completed' || activity.startDateTime.toDate() < now;
    });

    const stats: PresenceStats = {
      totalActivities: pastActivities.length,
      attended: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
      totalPoints: 0
    };

    pastActivities.forEach(({ attendance }) => {
      if (!attendance) {
        stats.absent++;
        // stats.totalPoints += 0;
      } else {
        const points = calculatePoints(attendance.status);
        stats.totalPoints += points; // Use the utility from attendances.ts or recalculate? 
        // Note: attendance.points might be already stored, but let's trust the status.
        // Actually, let's look at status.
        
        switch (attendance.status) {
          case AttendanceStatus.PRESENT:
            stats.attended++;
            break;
          case AttendanceStatus.LATE:
            stats.late++;
            // stats.attended++; // Late usually counts as attended? Depending on logic. 
            // Often it's separate stats. Let's keep separate counts but maybe "Attended" includes Late in some views.
            // For strict mapping:
            break;
          case AttendanceStatus.SICK:
          case AttendanceStatus.EXCUSED:
            stats.excused++;
            break;
          case AttendanceStatus.ABSENT:
            stats.absent++;
            break;
          case AttendanceStatus.PENDING_APPROVAL:
            // Maybe treat as excused or absent until approved?
            // Let's count as excused/pending for now or just ignore from "absent"
            break;
        }
      }
    });

    // Attendance Rate = (Present + Late) / Total Past Activities
    // Exclude 'excused' from denominator? Or include?
    // Usually: (Present + Late) / Total * 100
    if (stats.totalActivities > 0) {
      const presentCount = stats.attended + stats.late;
      stats.attendanceRate = Math.round((presentCount / stats.totalActivities) * 100);
    }

    return {
      orPeriod,
      stats,
      activities: activitiesWithAttendance,
      userRegistration: registration
    };

  } catch (error) {
    console.error("Error getting user presence data:", error);
    throw error;
  }
}
