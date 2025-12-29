import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserSystemRoles, UserAssignments } from "@/schemas/users";

/**
 * Mengambil roles user dari Firestore
 */
export const getUserRoles = async (
  uid: string
): Promise<UserSystemRoles | null> => {
  try {
    const userRef = doc(db, "users_new", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const roles = userData.roles as UserSystemRoles;
      return roles;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return null;
  }
};

/**
 * Mengambil assignments user dari Firestore
 */
export const getUserAssignments = async (
  uid: string
): Promise<UserAssignments | null> => {
  try {
    const userRef = doc(db, "users_new", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const assignments = userData.assignments as UserAssignments | undefined;
      return assignments ?? null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user assignments:", error);
    return null;
  }
};

/**
 * Mengambil roles dan assignments user sekaligus (lebih efisien)
 */
export const getUserRolesAndAssignments = async (
  uid: string
): Promise<{
  roles: UserSystemRoles | null;
  assignments: UserAssignments | null;
}> => {
  try {
    const userRef = doc(db, "users_new", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        roles: (userData.roles as UserSystemRoles) ?? null,
        assignments: (userData.assignments as UserAssignments) ?? null,
      };
    }

    return { roles: null, assignments: null };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { roles: null, assignments: null };
  }
};
