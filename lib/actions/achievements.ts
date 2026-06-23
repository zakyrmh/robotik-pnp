"use server";

import { countAchievements } from "@/lib/repositories/achievements";

/**
 * Server action to retrieve the total count of achievements.
 *
 * @returns Promise resolving to the number of achievements.
 */
export async function getAchievementCountAction(): Promise<number> {
  return countAchievements();
}
