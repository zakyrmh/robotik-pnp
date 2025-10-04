export interface Attendance_tokens {
  _id: string,
  token: string,
  userId: string,
  activityId: string,
  generatedAt: Date,
  expiresAt: Date,
  isUsed: boolean,
  usedAt: Date,
  usedBy: string,
  ipAddress: string,
  userAgent: string
}