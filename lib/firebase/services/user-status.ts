import { database } from "@/lib/firebase/config";
import {
  ref,
  onDisconnect,
  set,
  update,
  serverTimestamp as rtdbTimestamp,
} from "firebase/database";
import { PresenceWriteData } from "@/schemas/presence";

// ============================================
// CONFIGURATION
// ============================================

const PRESENCE_PATH = "/status";
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 menit

// ============================================
// HELPER FUNCTIONS
// ============================================

const getStatusRef = (userId: string) =>
  ref(database, `${PRESENCE_PATH}/${userId}`);

// ============================================
// PRESENCE FUNCTIONS
// ============================================

/**
 * Set user sebagai online di Realtime Database
 *
 * Menyimpan:
 * - state: "online"
 * - lastChanged: server timestamp
 * - lastOnline: server timestamp (untuk "Last seen" feature)
 * - device: info browser/OS
 * - sessionId: korelasi dengan login audit
 * - isIdle: false (baru login, pasti aktif)
 *
 * Juga mengatur onDisconnect handler untuk auto-offline
 *
 * @param userId - User ID
 * @param device - Device info (browser, OS)
 * @param sessionId - Session ID dari login
 */
export const setUserOnline = async (
  userId: string,
  device?: string,
  sessionId?: string,
): Promise<void> => {
  if (!userId) return;

  const userStatusRef = getStatusRef(userId);

  // Data untuk status online
  const onlineData: PresenceWriteData = {
    state: "online",
    lastChanged: rtdbTimestamp(),
    lastOnline: rtdbTimestamp(), // Set lastOnline saat menjadi online
    isIdle: false,
  };

  if (device) {
    onlineData.device = device;
  }

  if (sessionId) {
    onlineData.sessionId = sessionId;
  }

  // Data untuk status offline (saat disconnect)
  // Note: Tidak update lastOnline saat offline
  const offlineData: PresenceWriteData = {
    state: "offline",
    lastChanged: rtdbTimestamp(),
    isIdle: false,
  };

  if (device) {
    offlineData.device = device;
  }

  if (sessionId) {
    offlineData.sessionId = sessionId;
  }

  try {
    // 1. Set handler untuk auto-offline saat disconnect
    await onDisconnect(userStatusRef).set(offlineData);

    // 2. Set status online sekarang
    await set(userStatusRef, onlineData);
  } catch (error) {
    console.error("Error setting user online:", error);
  }
};

/**
 * Set user sebagai offline di Realtime Database
 * Dipanggil saat user logout secara manual
 *
 * @param userId - User ID
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  if (!userId) return;

  const userStatusRef = getStatusRef(userId);

  const offlineData: PresenceWriteData = {
    state: "offline",
    lastChanged: rtdbTimestamp(),
    isIdle: false,
  };

  try {
    // Cancel onDisconnect handler karena kita manual logout
    await onDisconnect(userStatusRef).cancel();

    // Set status offline
    await set(userStatusRef, offlineData);
  } catch (error) {
    console.error("Error setting user offline:", error);
  }
};

/**
 * Set user sebagai idle (tidak berinteraksi >5 menit)
 * Dipanggil dari idle detection hook
 *
 * @param userId - User ID
 * @param isIdle - true jika idle, false jika aktif kembali
 */
export const setUserIdle = async (
  userId: string,
  isIdle: boolean,
): Promise<void> => {
  if (!userId) return;

  const userStatusRef = getStatusRef(userId);

  try {
    await update(userStatusRef, {
      isIdle,
      lastChanged: rtdbTimestamp(),
    });
  } catch (error) {
    console.error("Error setting user idle status:", error);
  }
};

/**
 * Update activity timestamp (untuk reset idle timer)
 * Dipanggil saat user berinteraksi dengan halaman
 *
 * @param userId - User ID
 */
export const updateActivity = async (userId: string): Promise<void> => {
  if (!userId) return;

  const userStatusRef = getStatusRef(userId);

  try {
    await update(userStatusRef, {
      lastChanged: rtdbTimestamp(),
      isIdle: false,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
  }
};

// ============================================
// EXPORTS
// ============================================

export { IDLE_TIMEOUT_MS, PRESENCE_PATH };
