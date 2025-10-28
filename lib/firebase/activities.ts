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
import { Activity } from '@/types/activities';

const COLLECTION_NAME = 'activities';

/**
 * Convert Firestore document data to Activity type
 * Handles Timestamp conversion properly
 */
function convertDocToActivity(docId: string, data: Record<string, unknown>): Activity {
  return {
    id: docId,
    ...data,
    startDateTime: data.startDateTime instanceof Timestamp ? data.startDateTime : Timestamp.fromDate(new Date(data.startDateTime as string | number | Date)),
    endDateTime: data.endDateTime instanceof Timestamp ? data.endDateTime : Timestamp.fromDate(new Date(data.endDateTime as string | number | Date)),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
  } as Activity;
}

export async function getActivities(filters?: {
  status?: string;
}) {
  try {
    console.log('Fetching activities with filters:', filters);
    
    let q;
    
    // Query without deletedAt filter - we'll filter on client side
    if (!filters?.status || filters.status === 'all') {
      // Query without status filter
      q = query(
        collection(db, COLLECTION_NAME),
        orderBy('startDateTime', 'desc')
      );
    } else {
      // Query with status filter
      q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', filters.status),
        orderBy('startDateTime', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    console.log('Firestore snapshot size:', snapshot.size);
    
    // Filter out deleted activities on client side
    const activities = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        return convertDocToActivity(doc.id, data);
      })
      .filter((activity) => {
        // Filter out deleted activities (deletedAt is null, undefined, or doesn't exist)
        return !activity.deletedAt;
      });

    console.log('Processed activities after filtering:', activities.length);
    return activities;
  } catch (error) {
    console.error('Error getting activities:', error);
    
    // If error is about missing index, provide helpful message
    if (error instanceof Error && error.message.includes('index')) {
      console.error(
        'Missing Firestore index. Please create a composite index:\n' +
        'Collection: activities\n' +
        'Fields: status (Ascending), startDateTime (Descending)\n' +
        'Or follow the link in the error message above.'
      );
    }
    
    throw error;
  }
}

/**
 * Get activity by ID
 * Returns null if activity doesn't exist or has been deleted
 */
export async function getActivityById(id: string): Promise<Activity | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Don't return deleted activities
      if (data.deletedAt) {
        return null;
      }
      
      return convertDocToActivity(docSnap.id, data);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting activity by ID:', error);
    throw error;
  }
}

/**
 * Create a new activity
 * Returns the ID of the created activity
 */
export async function createActivity(
  data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      deletedAt: null, // Initialize as not deleted
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

/**
 * Update an existing activity
 */
export async function updateActivity(
  id: string,
  data: Partial<Omit<Activity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'deletedBy'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
}

/**
 * Soft delete an activity
 * The activity will be marked as deleted but not removed from database
 */
export async function deleteActivity(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error soft deleting activity:', error);
    throw error;
  }
}

/**
 * Permanently delete an activity from database
 * WARNING: This action cannot be undone!
 */
export async function hardDeleteActivity(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error hard deleting activity:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted activity
 */
export async function restoreActivity(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring activity:', error);
    throw error;
  }
}

/**
 * Get all deleted activities (for admin purposes)
 */
export async function getDeletedActivities(): Promise<Activity[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '!=', null),
      orderBy('deletedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    const activities = snapshot.docs.map((doc) => 
      convertDocToActivity(doc.id, doc.data())
    );

    return activities;
  } catch (error) {
    console.error('Error getting deleted activities:', error);
    throw error;
  }
}