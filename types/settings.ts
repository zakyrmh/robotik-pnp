import { OrPhase } from "@/types/enum";
import { Timestamp } from "firebase/firestore";
import { PaymentMethod } from "./registrations";

export interface AppSettings {
  // OR Configuration
  currentOrPeriod: string; // e.g., "OR 21"
  currentOrYear: string; // e.g., "2025-2026"
  currentPhase: OrPhase;
  registrationOpen: boolean;
  endDateRegistration: Timestamp;

  // Registration
  registrationFee: number;
  registrationBatches: {
    batchNumber: number;
    startDate: Timestamp;
    endDate: Timestamp;
    isActive: boolean;
  }[];

  // Payment Accounts
  paymentAccounts: {
    method: PaymentMethod;
    provider?: string; // Bank name atau e-wallet provider
    accountNumber: string;
    accountName: string;
    isActive: boolean;
  }[];

  // File Upload Limits
  maxFileSize: number; // Default 5MB
  allowedFileTypes: string[];

  // Attendance
  defaultLateTolerance: number; // Default 15 menit
  defaultAttendanceWindow: number; // Default 1 jam sebelum & sesudah

  // Scoring
  attendancePoints: {
    present: number; // 100
    late: number; // 75
    excused: number; // 50
    sick: number; // 50
    absent: number; // 0
  };

  // Notification
  whatsappApiKey?: string;
  whatsappEnabled: boolean;

  // Data Retention
  deleteRejectedAfterDays: number; // 90 hari

  // Metadata
  updatedBy: string;
  updatedAt: Timestamp;
}
