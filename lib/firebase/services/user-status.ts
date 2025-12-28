import { database } from "@/lib/firebase/config";
import {
  ref,
  onDisconnect,
  set,
  serverTimestamp as rtdbTimestamp,
} from "firebase/database";
import { UserPresence } from "@/schemas/presence";

const getStatusRef = (userId: string) => ref(database, `/status/${userId}`);

export const formatPresenceData = (
  state: "online" | "offline",
  device?: string
): UserPresence => {
  const data: UserPresence = {
    state,
    lastChanged: rtdbTimestamp() as unknown as Record<string, unknown>,
  };

  if (device) {
    data.device = device;
  }

  return data;
};

export const setUserOnline = async (userId: string, device?: string) => {
  if (!userId) return;

  const userStatusRef = getStatusRef(userId);
  const statusOffline = formatPresenceData("offline", device);
  const statusOnline = formatPresenceData("online", device);

  try {
    // Determine what to do when we disconnect
    await onDisconnect(userStatusRef).set(statusOffline);
    // Determine what to do *now* (set online)
    await set(userStatusRef, statusOnline);
  } catch (error) {
    console.error("Error setting user online:", error);
  }
};

export const setUserOffline = async (userId: string) => {
  if (!userId) return;

  const userStatusRef = getStatusRef(userId);
  const statusOffline = formatPresenceData("offline");

  try {
    await set(userStatusRef, statusOffline);
  } catch (error) {
    console.error("Error setting user offline:", error);
  }
};
