import { z } from "zod";

// ---------------------------------------------------------
// 1. ENUMS & BASIC TYPES
// ---------------------------------------------------------

export const UserStateEnum = z.enum(["online", "offline"]);

// ---------------------------------------------------------
// 2. MAIN SCHEMAS
// ---------------------------------------------------------

export const UserPresenceSchema = z.object({
  state: UserStateEnum,

  // lastChanged bisa berupa number (timestamp unix saat read)
  // atau object (ServerValue.TIMESTAMP saat write)
  lastChanged: z.union([
    z.number(),
    z.record(z.string(), z.unknown()), // Representasi aman untuk 'object' generik
  ]),

  // Opsional: melacak device login
  device: z.string().optional(),
});

// Schema untuk root path "/status", dimana key-nya adalah userId (string dynamic)
export const RootStatusSchema = z.record(z.string(), UserPresenceSchema);

// ---------------------------------------------------------
// 3. EXPORT TYPES (Inferensi Otomatis)
// ---------------------------------------------------------

export type UserState = z.infer<typeof UserStateEnum>;
export type UserPresence = z.infer<typeof UserPresenceSchema>;
export type RootStatus = z.infer<typeof RootStatusSchema>;
