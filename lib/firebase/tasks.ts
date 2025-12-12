import { db } from "@/lib/firebaseConfig";
import { Task } from "@/types/tasks";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";

const COLLECTION_NAME = "tasks";

type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds: number;
};

const removeUndefinedFields = <T extends Record<string, unknown>>(data: T): T => {
  const sanitized = {} as T;
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  });
  return sanitized;
};

const toTimestamp = (value?: unknown, fallback?: Timestamp): Timestamp => {
  if (value instanceof Timestamp) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    "nanoseconds" in value
  ) {
    const { seconds, nanoseconds } = value as FirestoreTimestampLike;
    return new Timestamp(seconds, nanoseconds);
  }

  return fallback ?? Timestamp.now();
};

const convertDocToTask = (docId: string, data: Record<string, unknown>): Task => {
  return {
    id: docId,
    ...data,
    deadline: toTimestamp(data.deadline),
    createdAt: toTimestamp(data.createdAt),
    updatedAt: toTimestamp(data.updatedAt),
    deletedAt: data.deletedAt ? toTimestamp(data.deletedAt) : undefined,
  } as Task;
};

export const getTasks = async ({
  includeDeleted = false,
  orPeriod,
  isVisible,
}: {
  includeDeleted?: boolean;
  orPeriod?: string;
  isVisible?: boolean;
} = {}): Promise<Task[]> => {
  let q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));

  const conditions = [];
  if (orPeriod) {
    conditions.push(where("orPeriod", "==", orPeriod));
  }
  if (isVisible !== undefined) {
    conditions.push(where("isVisible", "==", isVisible));
  }

  if (conditions.length > 0) {
    q = query(collection(db, COLLECTION_NAME), ...conditions, orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => convertDocToTask(docSnap.id, docSnap.data()))
    .filter((task) => (includeDeleted ? true : !task.deletedAt));
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }

  const task = convertDocToTask(docSnap.id, docSnap.data());
  if (task.deletedAt) {
    return null;
  }

  return task;
};

export const createTask = async (
  payload: Omit<Task, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">
): Promise<string> => {
  const cleanedPayload = removeUndefinedFields(payload);
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...cleanedPayload,
    deletedAt: null,
    deletedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const updateTask = async (
  id: string,
  payload: Partial<
    Omit<Task, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">
  >
) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const cleanedPayload = removeUndefinedFields(payload);
  await updateDoc(docRef, {
    ...cleanedPayload,
    updatedAt: serverTimestamp(),
  });
};

export const softDeleteTask = async (id: string, userId: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
    deletedBy: userId,
    updatedAt: serverTimestamp(),
  });
};

export const restoreTask = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    deletedAt: null,
    deletedBy: null,
    updatedAt: serverTimestamp(),
  });
};
export const getDeletedTasks = async (): Promise<Task[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("deletedAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => convertDocToTask(docSnap.id, docSnap.data()))
    .filter((task) => task.deletedAt);
};

export const hardDeleteTask = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
