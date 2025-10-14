import { Timestamp } from "firebase/firestore";
import { NotificationChannel, NotificationPriority, NotificationType } from "@/types/enum";

export interface Notification {
  id: string;
  userId: string; // Penerima
  
  // Content
  type: NotificationType;
  title: string;
  message: string;
  
  // Priority & Channel
  priority: NotificationPriority;
  channels: NotificationChannel[];
  
  // Action
  actionUrl?: string; // Deep link ke halaman terkait
  actionLabel?: string;
  
  // Reference
  referenceId?: string; // ID dari activity/task/submission
  referenceType?: 'activity' | 'task' | 'submission' | 'announcement';
  
  // Status
  isRead: boolean;
  readAt?: Timestamp;
  
  // WhatsApp
  whatsappSent: boolean;
  whatsappSentAt?: Timestamp;
  whatsappStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
  
  // Expiry
  expiresAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
}