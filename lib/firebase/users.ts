import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
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
  userData: Partial<
    Omit<
      User,
      "id" | "email" | "emailVerified" | "registrationId" | "createdAt"
    >
  >
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
    const readOnlyFields = [
      "id",
      "email",
      "emailVerified",
      "registrationId",
      "createdAt",
    ];
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


/**
 * Mengambil daftar kandidat (CAANG) berdasarkan OR Period.
 * Logika: 
 * 1. Cari dokumen di 'registrations' yang orPeriod-nya sesuai.
 * 2. Ambil ID dokumennya (karena ID registration == ID user).
 * 3. Fetch data user dari collection 'users' berdasarkan ID tersebut.
 */
export const getCandidatesByPeriod = async (orPeriod: string): Promise<User[]> => {
  try {
    // 1. Ambil data dari collection 'registrations' dulu
    const regRef = collection(db, "registrations");
    
    // Filter berdasarkan orPeriod
    // Opsional: Tambahkan filter status jika perlu (misal: status != 'rejected')
    const q = query(regRef, where("orPeriod", "==", orPeriod));
    
    const regSnapshot = await getDocs(q);

    if (regSnapshot.empty) {
      return [];
    }

    // 2. Ambil List ID user dari dokumen registration yang ditemukan
    const userIds = regSnapshot.docs.map((doc) => doc.id);

    // 3. Ambil data User secara paralel berdasarkan ID
    // Kita menggunakan Promise.all agar pengambilan data berjalan serentak (cepat)
    const userPromises = userIds.map(async (userId) => {
      const userDocRef = doc(db, "users_new", userId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
      }
      return null;
    });

    const usersResult = await Promise.all(userPromises);

    // 4. Filter hasil yang null (jaga-jaga jika ada ID di registration tapi tidak ada di users)
    return usersResult.filter((user): user is User => user !== null);

  } catch (error) {
    console.error("Error fetching candidates by period:", error);
    return [];
  }
};