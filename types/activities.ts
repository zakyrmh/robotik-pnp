export interface Activities {
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  type: "workshop" | "competition" | "meeting" | "showcase";
  status: "upcoming" | "ongoing" | "completed";
  maxParticipants: number;
  currentParticipants: number;
  requirements?: string[];
  icon: string;
  attendanceWindow?: {
    openBefore: number;
    closeAfter: number;
  };
  lateThreshold?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}