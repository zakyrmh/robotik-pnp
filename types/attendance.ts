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
  checkInLocation?: {          // ⭐ Buat optional (?)
    latitude: number;          // ⭐ Ubah Number → number (lowercase)
    longitude: number;         // ⭐ Ubah Number → number (lowercase)
  };
  notes?: string;              // ⭐ TAMBAH: Catatan admin jika ada masalah
  createdAt: Date;
}