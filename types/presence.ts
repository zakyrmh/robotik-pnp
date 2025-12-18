export type UserState = "online" | "offline";

export interface UserPresence {
  state: UserState;
  lastChanged: number | object; // Menggunakan number (timestamp) atau ServerValue.TIMESTAMP
  device?: string; // Opsional: Untuk melacak login dari Web, Mobile, dll.
}

// Struktur folder di RTDB biasanya: /status/{userId}
export interface RootStatusSchema {
  [userId: string]: UserPresence;
}
