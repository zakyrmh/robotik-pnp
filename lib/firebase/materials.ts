import { db } from '@/lib/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { Material } from '@/types/materials';

const COLLECTION_NAME = 'materials';

/**
 * Convert Firestore document data to Material type
 * Handles Timestamp conversion properly
 */
function convertDocToMaterial(docId: string, data: Record<string, unknown>): Material {
  return {
    id: docId,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
  } as Material;
}

/**
 * Get all materials with optional filters
 */
export async function getMaterials(filters?: {
  activityId?: string;
  orPeriod?: string;
  category?: string;
  isPublic?: boolean;
}) {
  try {
    console.log('Fetching materials with filters:', filters);
    
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    // Apply filters if provided
    const conditions = [];
    if (filters?.activityId) {
      conditions.push(where('activityId', '==', filters.activityId));
    }
    if (filters?.orPeriod) {
      conditions.push(where('orPeriod', '==', filters.orPeriod));
    }
    if (filters?.category) {
      conditions.push(where('category', '==', filters.category));
    }
    if (filters?.isPublic !== undefined) {
      conditions.push(where('isPublic', '==', filters.isPublic));
    }
    
    if (conditions.length > 0) {
      q = query(collection(db, COLLECTION_NAME), ...conditions, orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    console.log('Firestore snapshot size:', snapshot.size);
    
    // Filter out deleted materials on client side
    const materials = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        return convertDocToMaterial(doc.id, data);
      })
      .filter((material) => {
        // Filter out deleted materials
        return !material.deletedAt;
      });

    console.log('Processed materials after filtering:', materials.length);
    return materials;
  } catch (error) {
    console.error('Error getting materials:', error);
    throw error;
  }
}

/**
 * Get material by ID
 * Returns null if material doesn't exist or has been deleted
 */
export async function getMaterialById(id: string): Promise<Material | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Don't return deleted materials
      if (data.deletedAt) {
        return null;
      }
      
      return convertDocToMaterial(docSnap.id, data);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting material by ID:', error);
    throw error;
  }
}

/**
 * Create a new material
 * Returns the ID of the created material
 */
export async function createMaterial(
  data: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      downloadCount: 0,
      deletedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating material:', error);
    throw error;
  }
}

/**
 * Update an existing material
 */
export async function updateMaterial(
  id: string,
  data: Partial<Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'deletedBy' | 'downloadCount'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating material:', error);
    throw error;
  }
}

/**
 * Soft delete a material
 * The material will be marked as deleted but not removed from database
 */
export async function deleteMaterial(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error soft deleting material:', error);
    throw error;
  }
}

/**
 * Permanently delete a material from database
 * WARNING: This action cannot be undone!
 */
export async function hardDeleteMaterial(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error hard deleting material:', error);
    throw error;
  }
}

/**
 * Increment download count for a material
 */
export async function incrementDownloadCount(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      downloadCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted material
 */
export async function restoreMaterial(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring material:', error);
    throw error;
  }
}

/**
 * Get all deleted materials (for admin purposes)
 */
export async function getDeletedMaterials(): Promise<Material[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '!=', null),
      orderBy('deletedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    const materials = snapshot.docs.map((doc) => 
      convertDocToMaterial(doc.id, doc.data())
    );

    return materials;
  } catch (error) {
    console.error('Error getting deleted materials:', error);
    throw error;
  }
}
