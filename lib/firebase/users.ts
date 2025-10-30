import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { User } from "@/types/users";

const USERS_COLLECTION = "users_new";

// Response type for consistent error handling
interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all users from Firestore
 * @returns Promise with array of users or error
 */
export const getUsers = async (): Promise<FirebaseResponse<User[]>> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);

    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      } as User);
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error getting users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get users",
    };
  }
};

/**
 * Get a single user by ID
 * @param userId - The user ID to fetch
 * @returns Promise with user data or error
 */
export const getUserById = async (
  userId: string
): Promise<FirebaseResponse<User>> => {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    } as User;

    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get user",
    };
  }
};

/**
 * Update user data (partial or full update)
 * @param userId - The user ID to update
 * @param userData - Partial user data to update
 * @returns Promise with updated user data or error
 */
export const updateUser = async (
  userId: string,
  userData: Partial<Omit<User, "id" | "email" | "emailVerified" | "registrationId" | "createdAt">>
): Promise<FirebaseResponse<User>> => {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    // Check if user exists
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Prepare update data with automatic updatedAt
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp(),
    };

    // Remove read-only fields if they somehow got included
    const readOnlyFields = ["id", "email", "emailVerified", "registrationId", "createdAt"];
    readOnlyFields.forEach((field) => {
      if (field in updateData) {
        delete updateData[field as keyof typeof updateData];
      }
    });

    // Update the document
    await updateDoc(userRef, updateData);

    // Fetch and return updated user
    const updatedUserDoc = await getDoc(userRef);
    const updatedUser = {
      id: updatedUserDoc.id,
      ...updatedUserDoc.data(),
    } as User;

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
};

/**
 * Soft delete a user
 * @param userId - The user ID to delete
 * @param deletedBy - The ID of the user performing the deletion
 * @param deleteReason - Optional reason for deletion
 * @returns Promise with deleted user data or error
 */
export const deleteUser = async (
  userId: string,
  deletedBy: string,
  deleteReason?: string
): Promise<FirebaseResponse<User>> => {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    if (!deletedBy) {
      return {
        success: false,
        error: "Deleted by user ID is required",
      };
    }

    // Check if user exists
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Soft delete: set deletedAt, deletedBy, and deleteReason
    const deleteData: {
      deletedAt: ReturnType<typeof serverTimestamp>;
      deletedBy: string;
      deleteReason?: string;
      isActive: boolean;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      deletedAt: serverTimestamp(),
      deletedBy,
      isActive: false,
      updatedAt: serverTimestamp(),
    };

    if (deleteReason) {
      deleteData.deleteReason = deleteReason;
    }

    // Update the document with soft delete
    await updateDoc(userRef, deleteData);

    // Fetch and return deleted user
    const deletedUserDoc = await getDoc(userRef);
    const deletedUser = {
      id: deletedUserDoc.id,
      ...deletedUserDoc.data(),
    } as User;

    return {
      success: true,
      data: deletedUser,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
};