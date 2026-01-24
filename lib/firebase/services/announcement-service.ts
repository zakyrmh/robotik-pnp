import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Announcement, AnnouncementTarget } from "@/schemas/announcements";

// =========================================================
// TYPES
// =========================================================

export interface AnnouncementQueryOptions {
  target?: AnnouncementTarget;
  orPeriod?: string;
  limit?: number;
  onlyPublished?: boolean;
  excludeExpired?: boolean;
}

// =========================================================
// SERVICES
// =========================================================

/**
 * Mengambil daftar pengumuman berdasarkan target audience
 */
export async function getAnnouncements(
  options: AnnouncementQueryOptions = {},
): Promise<Announcement[]> {
  try {
    const {
      target,
      orPeriod,
      limit: queryLimit = 10,
      onlyPublished = true,
      excludeExpired = true,
    } = options;

    const announcementsRef = collection(db, "announcements");

    // Build query constraints
    const constraints: ReturnType<typeof where>[] = [];

    // Filter by published status
    if (onlyPublished) {
      constraints.push(where("isPublished", "==", true));
    }

    // Filter by target audience (if specified, also include "all")
    if (target && target !== "all") {
      constraints.push(where("targetAudience", "in", [target, "all"]));
    }

    // Filter by OR period (if specified)
    if (orPeriod) {
      constraints.push(where("orPeriod", "==", orPeriod));
    }

    // Build the query
    const q = query(
      announcementsRef,
      ...constraints,
      orderBy("isPinned", "desc"),
      orderBy("createdAt", "desc"),
      limit(queryLimit),
    );

    const querySnapshot = await getDocs(q);

    const announcements: Announcement[] = [];
    const now = new Date();

    for (const doc of querySnapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as Announcement;

      // Filter out expired announcements (client-side)
      if (excludeExpired && data.expiresAt) {
        const expiresAt =
          data.expiresAt instanceof Timestamp
            ? data.expiresAt.toDate()
            : new Date(data.expiresAt);

        if (expiresAt < now) {
          continue;
        }
      }

      announcements.push(data);
    }

    return announcements;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error;
  }
}

/**
 * Mengambil pengumuman untuk Caang
 */
export async function getCaangAnnouncements(
  orPeriod?: string,
  maxItems: number = 5,
): Promise<Announcement[]> {
  return getAnnouncements({
    target: "caang",
    orPeriod,
    limit: maxItems,
    onlyPublished: true,
    excludeExpired: true,
  });
}
