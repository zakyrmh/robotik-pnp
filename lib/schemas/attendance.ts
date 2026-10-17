import { z } from "zod";

export const attendanceQrRequestSchema = z.object({
  activityId: z.uuid("ID kegiatan tidak valid."),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    })
    .optional(),
});
