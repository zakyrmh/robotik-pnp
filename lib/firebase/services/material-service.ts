import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import {
  Material,
  MaterialSchema,
  MaterialType,
  MaterialLog,
  MaterialLogSchema,
  MaterialAccessType,
} from "@/schemas/materials";

// =========================================================
// TYPES
// =========================================================

export interface MaterialFilters {
  orPeriod?: string;
  type?: MaterialType | "all";
  isVisible?: "all" | "visible" | "hidden";
}

// =========================================================
// COLLECTION PATHS
// =========================================================

const MATERIALS_COLLECTION = "materials";
const MATERIAL_LOGS_COLLECTION = "material_logs";

// =========================================================
// SERVICE FUNCTIONS
// =========================================================

/**
 * Fetch all materials with optional filters
 */
export async function getMaterials(
  filters?: MaterialFilters
): Promise<Material[]> {
  try {
    const materialsRef = collection(db, MATERIALS_COLLECTION);

    // Base query: order by createdAt desc, exclude deleted
    let q = query(
      materialsRef,
      where("deletedAt", "==", null),
      orderBy("createdAt", "desc")
    );

    // Apply filters if provided
    if (filters?.orPeriod && filters.orPeriod !== "all") {
      q = query(q, where("orPeriod", "==", filters.orPeriod));
    }

    if (filters?.type && filters.type !== "all") {
      q = query(q, where("type", "==", filters.type));
    }

    if (filters?.isVisible && filters.isVisible !== "all") {
      const isVisibleBool = filters.isVisible === "visible";
      q = query(q, where("isVisible", "==", isVisibleBool));
    }

    const snapshot = await getDocs(q);
    const materials: Material[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const parsed = MaterialSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        materials.push(parsed.data);
      } else {
        console.warn(
          `[material-service] Invalid material data for ${docSnap.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return materials;
  } catch (error) {
    console.error("[material-service] Error fetching materials:", error);
    throw error;
  }
}

/**
 * Get a single material by ID
 */
export async function getMaterialById(
  materialId: string
): Promise<Material | null> {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, materialId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const parsed = MaterialSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        return parsed.data;
      } else {
        console.error(
          `[material-service] Invalid material data for ${materialId}:`,
          parsed.error.flatten()
        );
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error(
      `[material-service] Error fetching material ${materialId}:`,
      error
    );
    throw error;
  }
}

/**
 * Create a new material
 */
export async function createMaterial(
  data: Omit<
    Material,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
    | "deletedBy"
    | "viewCount"
    | "downloadCount"
  >
): Promise<string> {
  try {
    const materialsRef = collection(db, MATERIALS_COLLECTION);

    // Cleanup undefined fields
    const cleanData = JSON.parse(JSON.stringify(data));

    const docRef = await addDoc(materialsRef, {
      ...cleanData,
      viewCount: 0,
      downloadCount: 0,
      deletedAt: null,
      deletedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[material-service] Error creating material:", error);
    throw error;
  }
}

/**
 * Update a material
 */
export async function updateMaterial(
  materialId: string,
  data: Partial<
    Omit<
      Material,
      "id" | "createdAt" | "updatedAt" | "viewCount" | "downloadCount"
    >
  >
): Promise<void> {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, materialId);

    // Convert undefined values to null (Firestore accepts null but not undefined)
    // This allows clearing fields when switching material types
    const cleanedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      cleanedData[key] = value === undefined ? null : value;
    }

    const updates: Record<string, unknown> = {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updates);
  } catch (error) {
    console.error(
      `[material-service] Error updating material ${materialId}:`,
      error
    );
    throw error;
  }
}

/**
 * Soft delete a material
 */
export async function deleteMaterial(
  materialId: string,
  deletedBy: string
): Promise<void> {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, materialId);
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      deletedBy,
    });
  } catch (error) {
    console.error(
      `[material-service] Error deleting material ${materialId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get unique OR Periods from all materials (for filter options)
 */
export async function getMaterialOrPeriods(): Promise<string[]> {
  try {
    const materialsRef = collection(db, MATERIALS_COLLECTION);
    const q = query(
      materialsRef,
      where("deletedAt", "==", null),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const periods = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.orPeriod) {
        periods.add(data.orPeriod);
      }
    });

    return Array.from(periods).sort().reverse();
  } catch (error) {
    console.error("[material-service] Error fetching periods:", error);
    return [];
  }
}

/**
 * Get all soft-deleted materials
 */
export async function getDeletedMaterials(): Promise<Material[]> {
  try {
    const materialsRef = collection(db, MATERIALS_COLLECTION);
    const q = query(
      materialsRef,
      where("deletedAt", "!=", null),
      orderBy("deletedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const materials: Material[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const parsed = MaterialSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        materials.push(parsed.data);
      } else {
        console.warn(
          `[material-service] Invalid deleted material data for ${docSnap.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return materials;
  } catch (error) {
    console.error(
      "[material-service] Error fetching deleted materials:",
      error
    );
    throw error;
  }
}

/**
 * Restore a soft-deleted material
 */
export async function restoreMaterial(materialId: string): Promise<void> {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, materialId);
    await updateDoc(docRef, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(
      `[material-service] Error restoring material ${materialId}:`,
      error
    );
    throw error;
  }
}

/**
 * Permanently delete a material (hard delete)
 * Also deletes the associated file from Storage if exists
 */
export async function permanentDeleteMaterial(
  materialId: string
): Promise<void> {
  try {
    // 1. Get the material to check if there's a file to delete
    const material = await getMaterialById(materialId);

    if (material?.type === "file" && material.fileUrl) {
      try {
        // Try to delete the file from storage
        const fileRef = ref(storage, material.fileUrl);
        await deleteObject(fileRef);
        console.log(
          `[material-service] Deleted file for material ${materialId}`
        );
      } catch (storageError) {
        // File might not exist in storage, log but continue
        console.warn(
          `[material-service] Could not delete storage file:`,
          storageError
        );
      }
    }

    // 2. Delete all related logs
    const logsRef = collection(db, MATERIAL_LOGS_COLLECTION);
    const logsQuery = query(logsRef, where("materialId", "==", materialId));
    const logsSnapshot = await getDocs(logsQuery);

    const deleteLogPromises = logsSnapshot.docs.map((docSnap) => {
      return deleteDoc(doc(db, MATERIAL_LOGS_COLLECTION, docSnap.id));
    });

    await Promise.all(deleteLogPromises);

    console.log(
      `[material-service] Deleted ${logsSnapshot.size} logs for material ${materialId}`
    );

    // 3. Delete the material document itself
    const materialDocRef = doc(db, MATERIALS_COLLECTION, materialId);
    await deleteDoc(materialDocRef);

    console.log(
      `[material-service] Permanently deleted material ${materialId}`
    );
  } catch (error) {
    console.error(
      `[material-service] Error permanently deleting material ${materialId}:`,
      error
    );
    throw error;
  }
}

// =========================================================
// FILE UPLOAD FUNCTIONS
// =========================================================

/**
 * Upload a file to Firebase Storage and return the download URL
 */
export async function uploadMaterialFile(
  file: File,
  orPeriod: string
): Promise<{
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}> {
  try {
    // Create a unique path: materials/{orPeriod}/{timestamp}_{filename}
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `materials/${orPeriod}/${timestamp}_${safeName}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(storageRef);

    return {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
  } catch (error) {
    console.error("[material-service] Error uploading file:", error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteMaterialFile(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("[material-service] Error deleting file:", error);
    throw error;
  }
}

// =========================================================
// ANALYTICS/LOGGING FUNCTIONS
// =========================================================

/**
 * Log a material access (view or download)
 */
export async function logMaterialAccess(
  materialId: string,
  userId: string,
  orPeriod: string,
  action: MaterialAccessType,
  userAgent?: string
): Promise<void> {
  try {
    const logsRef = collection(db, MATERIAL_LOGS_COLLECTION);

    await addDoc(logsRef, {
      materialId,
      userId,
      orPeriod,
      action,
      userAgent,
      timestamp: serverTimestamp(),
    });

    // Also increment the counter on the material document
    const materialRef = doc(db, MATERIALS_COLLECTION, materialId);
    if (action === "view") {
      await updateDoc(materialRef, {
        viewCount: increment(1),
      });
    } else if (action === "download") {
      await updateDoc(materialRef, {
        downloadCount: increment(1),
      });
    }
  } catch (error) {
    console.error("[material-service] Error logging material access:", error);
    // Don't throw - logging shouldn't break the main flow
  }
}

/**
 * Get access logs for a specific material
 */
export async function getMaterialLogs(
  materialId: string
): Promise<MaterialLog[]> {
  try {
    const logsRef = collection(db, MATERIAL_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where("materialId", "==", materialId),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    const logs: MaterialLog[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const parsed = MaterialLogSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        logs.push(parsed.data);
      } else {
        console.warn(
          `[material-service] Invalid log data for ${docSnap.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return logs;
  } catch (error) {
    console.error("[material-service] Error fetching material logs:", error);
    throw error;
  }
}

/**
 * Toggle material visibility
 */
export async function toggleMaterialVisibility(
  materialId: string,
  isVisible: boolean
): Promise<void> {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, materialId);
    await updateDoc(docRef, {
      isVisible,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(
      `[material-service] Error toggling visibility for ${materialId}:`,
      error
    );
    throw error;
  }
}
