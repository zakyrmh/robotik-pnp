/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from 'firebase/firestore';

/**
 * Convert JSON timestamp to Firestore Timestamp
 */
export function convertJsonTimestamp(jsonTimestamp: {
  _seconds: number;
  _nanoseconds: number;
} | null | undefined): Timestamp | null {
  if (!jsonTimestamp) return null;
  return new Timestamp(jsonTimestamp._seconds, jsonTimestamp._nanoseconds);
}

/**
 * Convert activity data dengan timestamps
 */
export function convertActivityTimestamps(activity: any) {
  return {
    ...activity,
    scheduledDate: convertJsonTimestamp(activity.scheduledDate),
    endDate: convertJsonTimestamp(activity.endDate),
    attendanceOpenTime: convertJsonTimestamp(activity.attendanceOpenTime),
    attendanceCloseTime: convertJsonTimestamp(activity.attendanceCloseTime),
    createdAt: convertJsonTimestamp(activity.createdAt),
    updatedAt: convertJsonTimestamp(activity.updatedAt),
    deletedAt: convertJsonTimestamp(activity.deletedAt),
  };
}

/**
 * Convert task data dengan timestamps
 */
export function convertTaskTimestamps(task: any) {
  return {
    ...task,
    deadline: convertJsonTimestamp(task.deadline),
    lateSubmissionDeadline: convertJsonTimestamp(task.lateSubmissionDeadline),
    createdAt: convertJsonTimestamp(task.createdAt),
    updatedAt: convertJsonTimestamp(task.updatedAt),
  };
}