import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// Helper Timestamp
const TimestampSchema = z.custom<Timestamp>(
  (data) => data instanceof Timestamp,
  { message: "Must be a Firestore Timestamp" }
);

export const AppSettingsSchema = z.object({
  // OR Configuration
  currentOrPeriod: z.string(),
  currentOrYear: z.string(),
  currentPhase: z.enum(["registration", "interview", "announcement", "closed"]), // Sesuaikan jika perlu
  registrationOpen: z.boolean(),
  endDateRegistration: TimestampSchema,

  // Registration & Batches
  registrationFee: z.number().nonnegative(),
  registrationBatches: z.array(
    z.object({
      batchNumber: z.number(),
      startDate: TimestampSchema,
      endDate: TimestampSchema,
      isActive: z.boolean(),
    })
  ),

  // Metadata
  updatedBy: z.string().optional(),
  updatedAt: TimestampSchema.optional(),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
