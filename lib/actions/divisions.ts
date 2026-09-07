"use server";

import { countDivisions, getDivisions } from "@/lib/repositories/divisions";

/**
 * Server action to retrieve the total count of divisions.
 *
 * @returns Promise resolving to the number of divisions.
 */
export async function getDivisionCountAction(): Promise<number> {
  return countDivisions();
}

/**
 * Server action to retrieve all active divisions.
 *
 * @returns Promise resolving to the list of active divisions.
 */
export async function getDivisionsAction() {
  return getDivisions();
}
