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
import { Registration } from '@/types/registrations';
import { RegistrationStatus } from '@/types/enum';

const COLLECTION_NAME = 'registrations';

/**
 * Convert Firestore document data to Registration type
 */
function convertDocToRegistration(docId: string, data: Record<string, unknown>): Registration {
  return {
    id: docId,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
    submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt : undefined,
  } as Registration;
}

/**
 * Get all registrations with optional filters
 */
export async function getRegistrations(filters?: {
  status?: RegistrationStatus;
  orPeriod?: string;
}) {
  try {
    console.log('Fetching registrations with filters:', filters);
    
    let q = query(collection(db, COLLECTION_NAME));
    
    // Apply filters
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
    
    const registrations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return convertDocToRegistration(doc.id, data);
    });

    console.log('Processed registrations:', registrations.length);
    return registrations;
  } catch (error) {
    console.error('Error getting registrations:', error);
    
    // If error is about missing index, provide helpful message
    if (error instanceof Error && error.message.includes('index')) {
      console.error(
        'Missing Firestore index. Please create a composite index:\n' +
        'Collection: registrations\n' +
        'Fields: status (Ascending), createdAt (Descending)\n' +
        'Or follow the link in the error message above.'
      );
    }
    
    throw error;
  }
}

/**
 * Get registration by ID (user ID)
 */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return convertDocToRegistration(docSnap.id, data);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting registration by ID:', error);
    throw error;
  }
}

/**
 * Create a new registration
 */
export async function createRegistration(
  userId: string,
  data: Omit<Registration, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    // Use userId as document ID
    const docRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
}

/**
 * Update an existing registration
 */
export async function updateRegistration(
  id: string,
  data: Partial<Omit<Registration, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
}

/**
 * Delete a registration
 */
export async function deleteRegistration(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting registration:', error);
    throw error;
  }
}

/**
 * Get registrations by OR period
 */
export async function getRegistrationsByOrPeriod(orPeriod: string): Promise<Registration[]> {
  return getRegistrations({ orPeriod });
}

/**
 * Get registrations by status
 */
export async function getRegistrationsByStatus(status: RegistrationStatus): Promise<Registration[]> {
  return getRegistrations({ status });
}

/**
 * Count registrations by status for a specific OR period
 */
export async function countRegistrationsByStatus(orPeriod?: string): Promise<Record<string, number>> {
  try {
    const registrations = await getRegistrations(orPeriod ? { orPeriod } : undefined);
    
    const counts: Record<string, number> = {
      draft: 0,
      form_submitted: 0,
      documents_uploaded: 0,
      payment_pending: 0,
      verified: 0,
      rejected: 0,
    };
    
    registrations.forEach((reg) => {
      if (reg.status in counts) {
        counts[reg.status]++;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error counting registrations by status:', error);
    throw error;
  }
}
