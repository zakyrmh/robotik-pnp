export interface Activity {
  uid: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  date: Date;
  location: string;
  type: "workshop" | "competition" | "meeting" | "showcase";
  status: "upcoming" | "ongoing" | "completed";
  maxParticipants: number;
  currentParticipants: number;
  instructor?: string;
  requirements?: string[];
  icon: React.ReactNode;
}
