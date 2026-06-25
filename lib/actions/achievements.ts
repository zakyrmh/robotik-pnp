"use server";

import { countAchievements } from "@/lib/repositories/achievements";
import { createClient } from "@/lib/supabase/server";
import { AchievementWithDivision } from "@/app/(marketing)/prestasi/PrestasiClient";

export async function getAchievementCountAction(): Promise<number> {
  return countAchievements();
}

export async function getAchievementsAction() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("achievements")
      .select(`
        id,
        title,
        description,
        year,
        level,
        division_id,
        divisions (
          id,
          name,
          slug,
          badge_color
        )
      `)
      .order("year", { ascending: false });

    if (error) {
      console.error("Failed to get achievements:", error.message);
      return [];
    }

    return data as unknown as AchievementWithDivision[];
  } catch (error) {
    console.error("Failed to get achievements action:", error);
    return [];
  }
}
