import { z } from "zod";

// ---------------------------------------------------------
// 1. ENUMS & BASIC TYPES
// ---------------------------------------------------------

export const UserStateEnum = z.enum(["online", "offline"]);

// ---------------------------------------------------------
// 2. MAIN SCHEMAS
// ---------------------------------------------------------

/**
 * Schema untuk presence data di Realtime Database
 *
 * Path: /status/{userId}
 *
 * @version 1.5.0 - Added lastOnline, sessionId, isIdle
 */
export const UserPresenceSchema = z.object({
  // Status online/offline
  state: UserStateEnum,

  // Kapan status terakhir berubah (online->offline atau sebaliknya)
  // Bisa number (saat read) atau object (ServerValue.TIMESTAMP saat write)
  lastChanged: z.union([
    z.number(),
    z.record(z.string(), z.unknown()), // Representasi aman untuk ServerValue.TIMESTAMP
  ]),

  // Kapan user terakhir online (untuk "Last seen" feature)
  // Hanya update saat user MENJADI online, tidak saat offline
  lastOnline: z
    .union([z.number(), z.record(z.string(), z.unknown())])
    .optional(),

  // Info device/browser
  device: z.string().optional(),

  // Session ID untuk korelasi dengan login audit
  sessionId: z.string().optional(),

  // Apakah user sedang idle (tidak berinteraksi >5 menit)
  isIdle: z.boolean().optional(),
});

// Schema untuk root path "/status", dimana key-nya adalah userId (string dynamic)
export const RootStatusSchema = z.record(z.string(), UserPresenceSchema);

// ---------------------------------------------------------
// 3. WRITE DATA TYPES (untuk menulis ke Realtime Database)
// ---------------------------------------------------------

/**
 * Interface untuk menulis presence data ke Realtime Database
 * Menggunakan number untuk timestamps (dari Date.now() atau serverTimestamp)
 */
export interface PresenceWriteData {
  state: "online" | "offline";
  lastChanged: object | number; // ServerValue.TIMESTAMP atau Date.now()
  lastOnline?: object | number;
  device?: string;
  sessionId?: string;
  isIdle?: boolean;
}

/**
 * Interface untuk membaca presence data dari Realtime Database
 * Timestamps sudah dikonversi menjadi number
 */
export interface PresenceReadData {
  state: "online" | "offline";
  lastChanged: number;
  lastOnline?: number;
  device?: string;
  sessionId?: string;
  isIdle?: boolean;
}

// ---------------------------------------------------------
// 4. EXPORT TYPES (Inferensi dari Schema)
// ---------------------------------------------------------

export type UserState = z.infer<typeof UserStateEnum>;
export type UserPresence = z.infer<typeof UserPresenceSchema>;
export type RootStatus = z.infer<typeof RootStatusSchema>;
