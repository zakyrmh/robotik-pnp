import { Timestamp } from "firebase/firestore";

export interface Feedback {
  id: string;
  userId: string; // Yang kasih feedback
  targetId: string; // Mentor/admin yang di-feedback
  activityId?: string; // Terkait activity mana
  orPeriod: string;

  // Rating
  rating: number; // 1-5

  // Feedback Text
  comment?: string;

  // Anonymous
  isAnonymous: boolean;

  // Status
  isPublished: boolean;

  // Metadata
  createdAt: Timestamp;
}
