import { z } from "zod";
import { Timestamp } from "firebase/firestore";

const TimestampSchema = z
  .union([
    z.custom<Timestamp>((data) => data instanceof Timestamp),
    z.date(),
    z.string().datetime(),
  ])
  .transform((data) => {
    if (data instanceof Timestamp) return data.toDate();
    if (typeof data === "string") return new Date(data);
    return data;
  });

export const AssignmentStatusEnum = z.enum([
  "not_submitted",
  "submitted",
  "graded",
  "late",
]);

export const AssignmentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  submissionContent: z.string().optional(), // URL or Text
  submittedAt: TimestampSchema.optional(),
  score: z.number().min(0).optional(),
  feedback: z.string().optional(),
  gradedBy: z.string().optional(),
  gradedAt: TimestampSchema.optional(),
  status: AssignmentStatusEnum,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Assignment = z.infer<typeof AssignmentSchema>;
