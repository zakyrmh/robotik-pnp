import { z } from "zod";

export const eventCheckinSearchSchema = z.object({
  query: z.string().trim().max(100).default(""),
  categoryId: z.union([z.string().uuid(), z.literal("all")]).default("all"),
  attendance: z.enum(["all", "none", "partial", "complete"]).default("all"),
  badge: z.enum(["all", "pending", "complete"]).default("all"),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(50).default(20),
});

export const eventCheckinRegistrationIdSchema = z.string().uuid();

const expectedVersionsSchema = z.record(
  z.string().uuid(),
  z.number().int().nonnegative(),
);

export const recordEventCheckinSchema = z
  .object({
    registrationId: z.string().uuid(),
    memberIds: z.array(z.string().uuid()).min(1).max(20),
    action: z.enum(["present_and_badge", "present_only", "proxy_badge"]),
    expectedVersions: expectedVersionsSchema,
    proxyRole: z.enum(["leader", "advisor"]).optional(),
    proxyMemberId: z.string().uuid().optional(),
  })
  .superRefine((value, context) => {
    if (new Set(value.memberIds).size !== value.memberIds.length) {
      context.addIssue({
        code: "custom",
        path: ["memberIds"],
        message: "Pilihan anggota mengandung duplikat.",
      });
    }
    if (value.action === "proxy_badge" && !value.proxyRole) {
      context.addIssue({
        code: "custom",
        path: ["proxyRole"],
        message: "Perwakilan wajib dipilih.",
      });
    }
    if (
      value.action === "proxy_badge" &&
      value.proxyRole === "leader" &&
      !value.proxyMemberId
    ) {
      context.addIssue({
        code: "custom",
        path: ["proxyMemberId"],
        message: "Ketua penerima wajib dipilih.",
      });
    }
    for (const memberId of value.memberIds) {
      if (value.expectedVersions[memberId] === undefined) {
        context.addIssue({
          code: "custom",
          path: ["expectedVersions", memberId],
          message: "Versi status anggota tidak tersedia.",
        });
      }
    }
  });

export const recordAdvisorBadgeSchema = z
  .object({
    registrationId: z.string().uuid(),
    recipientRole: z.enum(["advisor", "leader"]),
    proxyMemberId: z.string().uuid().optional(),
    expectedVersion: z.number().int().nonnegative(),
  })
  .superRefine((value, context) => {
    if (value.recipientRole === "leader" && !value.proxyMemberId) {
      context.addIssue({
        code: "custom",
        path: ["proxyMemberId"],
        message: "Ketua penerima wajib dipilih.",
      });
    }
  });

export const correctEventCheckinSchema = z
  .object({
    registrationId: z.string().uuid(),
    target: z.enum(["member", "advisor"]),
    field: z.enum(["attendance", "badge"]),
    memberId: z.string().uuid().optional(),
    expectedVersion: z.number().int().nonnegative(),
    reason: z.string().trim().min(3).max(500),
  })
  .superRefine((value, context) => {
    if (value.target === "member" && !value.memberId) {
      context.addIssue({
        code: "custom",
        path: ["memberId"],
        message: "Anggota wajib dipilih.",
      });
    }
    if (value.target === "advisor" && value.field !== "badge") {
      context.addIssue({
        code: "custom",
        path: ["field"],
        message: "Pembimbing hanya memiliki status kokarde.",
      });
    }
  });

export type EventCheckinSearchInput = z.infer<typeof eventCheckinSearchSchema>;
export type RecordEventCheckinInput = z.infer<typeof recordEventCheckinSchema>;
export type RecordAdvisorBadgeInput = z.infer<typeof recordAdvisorBadgeSchema>;
export type CorrectEventCheckinInput = z.infer<
  typeof correctEventCheckinSchema
>;
