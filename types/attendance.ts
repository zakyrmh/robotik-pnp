import { ObjectId } from "mongodb";

export type AttendanceStatus = "present" | "late" | "invalid";

export interface Attendances {
  _id: ObjectId;
  activityId: ObjectId;
  userId: ObjectId;
  tokenId: ObjectId;
  status: AttendanceStatus;
  checkInTime: Date;
  checkInBy: ObjectId;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  createdAt: Date;
}