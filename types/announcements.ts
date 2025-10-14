import { AnnouncementCategory, NotificationPriority, UserRole } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Announcement {
  id: string;
  
  // Content
  title: string;
  content: string; // Bisa markdown
  category: AnnouncementCategory;
  
  // Target
  targetRoles: UserRole[]; // Siapa yang bisa lihat
  targetOrPeriods?: string[]; // Specific OR periods atau [] untuk all
  targetUserIds?: string[]; // Specific users (optional)
  
  // Priority
  priority: NotificationPriority;
  
  // Schedule
  publishedAt: Timestamp;
  expiresAt?: Timestamp;
  
  // Status
  isPublished: boolean;
  isDraft: boolean;
  
  // Send as notification
  sendNotification: boolean;
  notificationSent: boolean;
  notificationSentAt?: Timestamp;
  
  // Statistics
  viewCount: number;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}