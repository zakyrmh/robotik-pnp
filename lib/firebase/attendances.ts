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
} from 'firebase/firestore';
import { Attendance } from '@/types/attendances';
import { AttendanceStatus } from '@/types/enum';

const COLLECTION_NAME = 'attendances';

/**
 * Convert Firestore document data to Attendance type
 */
function convertDocToAttendance(docId: string, data: Record<string, unknown>): Attendance {
  return {
    id: docId,
    ...data,
    checkedInAt: data.checkedInAt instanceof Timestamp ? data.checkedInAt : undefined,
    approvedAt: data.approvedAt instanceof Timestamp ? data.approvedAt : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
  } as Attendance;
}

/**
 * Get all attendances with optional filters
 */
export async function getAttendances(filters?: {
  activityId?: string;
  userId?: string;
  status?: AttendanceStatus;
  orPeriod?: string;
}) {
  try {
    console.log('Fetching attendances with filters:', filters);
    
    let q = query(collection(db, COLLECTION_NAME));
    
    // Apply filters
    if (filters?.activityId) {
      q = query(q, where('activityId', '==', filters.activityId));
    }
    
    if (filters?.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters?.orPeriod) {
      q = query(q, where('orPeriod', '==', filters.orPeriod));
    }
    
    // Default ordering by createdAt descending
    q = query(q, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    console.log('Firestore snapshot size:', snapshot.size);
    
    // Filter out deleted attendances
    const attendances = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return convertDocToAttendance(doc.id, data);
      })
      .filter((attendance) => {
        // Filter out deleted attendances
        return !attendance.deletedAt;
      });

    console.log('Processed attendances after filtering:', attendances.length);
    return attendances;
  } catch (error) {
    console.error('Error getting attendances:', error);
    throw error;
  }
}

/**
 * Get attendance by ID
 */
export async function getAttendanceById(id: string): Promise<Attendance | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Don't return deleted attendances
      if (data.deletedAt) {
        return null;
      }
      
      return convertDocToAttendance(docSnap.id, data);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting attendance by ID:', error);
    throw error;
  }
}

/**
 * Get attendance by composite ID (activityId_userId)
 */
export async function getAttendanceByCompositeId(
  activityId: string,
  userId: string
): Promise<Attendance | null> {
  const compositeId = `${activityId}_${userId}`;
  return getAttendanceById(compositeId);
}

/**
 * Create a new attendance
 */
export async function createAttendance(
  data: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      deletedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating attendance:', error);
    throw error;
  }
}

/**
 * Update an existing attendance
 */
export async function updateAttendance(
  id: string,
  data: Partial<Omit<Attendance, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'deletedBy'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
}

/**
 * Soft delete an attendance
 */
export async function deleteAttendance(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error soft deleting attendance:', error);
    throw error;
  }
}

/**
 * Hard delete an attendance from database
 */
export async function hardDeleteAttendance(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error hard deleting attendance:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted attendance
 */
export async function restoreAttendance(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring attendance:', error);
    throw error;
  }
}

/**
 * Get attendances by activity ID
 */
export async function getAttendancesByActivity(activityId: string): Promise<Attendance[]> {
  return getAttendances({ activityId });
}

/**
 * Get attendances by user ID
 */
export async function getAttendancesByUser(userId: string): Promise<Attendance[]> {
  return getAttendances({ userId });
}

/**
 * Calculate points based on status
 */
export function calculatePoints(status: AttendanceStatus): number {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return 100;
    case AttendanceStatus.LATE:
      return 75;
    case AttendanceStatus.EXCUSED:
      return 50;
    case AttendanceStatus.SICK:
      return 50;
    case AttendanceStatus.ABSENT:
    case AttendanceStatus.PENDING_APPROVAL:
      return 0;
    default:
      return 0;
  }
}
