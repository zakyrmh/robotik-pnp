import { ObjectId } from "mongodb";

export interface Attendance_tokens {
  _id: ObjectId,
  token: string,
  userId: ObjectId,
  activityId: ObjectId,
  generatedAt: Date,
  expiresAt: Date,
  isUsed: boolean,
  usedAt: Date,
  usedBy: ObjectId,
  ipAddress: string,
  userAgent: string
}