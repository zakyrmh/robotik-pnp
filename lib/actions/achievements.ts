"use server";

import {
  countAchievements,
  getAchievements,
} from "@/lib/repositories/achievements";
import { AchievementWithDivision } from "@/app/(marketing)/prestasi/PrestasiClient";

export async function getAchievementCountAction(): Promise<number> {
  return countAchievements();
}

export async function getAchievementsAction(): Promise<
  AchievementWithDivision[]
> {
  try {
    const data = await getAchievements();
    return data as unknown as AchievementWithDivision[];
  } catch (error) {
    console.error("Failed to get achievements action:", error);
    return [];
  }
}
