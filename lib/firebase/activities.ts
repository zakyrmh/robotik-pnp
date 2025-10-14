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
} from 'firebase/firestore';
import { Activity } from '@/types/activities';

const COLLECTION_NAME = 'activities';

export async function getActivities(filters?: {
  orPeriod?: string;
  phase?: string;
  status?: string;
}) {
  try {
    // Base query - tanpa filter deletedAt dulu
    let q = query(
      collection(db, COLLECTION_NAME),
      orderBy('scheduledDate', 'desc')
    );

    // Apply filters
    if (filters?.orPeriod) {
      q = query(q, where('orPeriod', '==', filters.orPeriod));
    }
    if (filters?.phase) {
      q = query(q, where('phase', '==', filters.phase));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const snapshot = await getDocs(q);
    
    // Filter di client side untuk exclude deleted items
    const activities = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as Activity)
      .filter((activity) => !activity.deletedAt); // Filter yang sudah dihapus

    return activities;
  } catch (error) {
    console.error('Error getting activities:', error);
    throw error;
  }
}

export async function getActivityById(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Activity;
  }
  return null;
}

export async function createActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateActivity(id: string, data: Partial<Activity>) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteActivity(id: string, userId: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
    deletedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function hardDeleteActivity(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}