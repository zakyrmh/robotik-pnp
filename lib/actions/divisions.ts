"use server";

import { countDivisions } from "@/lib/repositories/divisions";

/**
 * Server action to retrieve the total count of divisions.
 *
 * @returns Promise resolving to the number of divisions.
 */
export async function getDivisionCountAction(): Promise<number> {
  return countDivisions();
}
