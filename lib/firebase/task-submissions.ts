import { db } from "@/lib/firebaseConfig";
import { TaskSubmission } from "@/types/tasks";
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
  where,
} from "firebase/firestore";

const COLLECTION_NAME = "task_submissions";

type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds: number;
};

const toTimestamp = (value?: unknown): Timestamp => {
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

  return Timestamp.now();
};

const convertDocToSubmission = (
  docId: string,
  data: Record<string, unknown>
): TaskSubmission => {
  return {
    id: docId,
    ...data,
    submittedAt: toTimestamp(data.submittedAt),
    createdAt: toTimestamp(data.createdAt),
    updatedAt: toTimestamp(data.updatedAt),
    gradedAt: data.gradedAt ? toTimestamp(data.gradedAt) : undefined,
    deletedAt: data.deletedAt ? toTimestamp(data.deletedAt) : undefined,
  } as TaskSubmission;
};

export const getTaskSubmissions = async ({
  taskId,
  userId,
  groupId,
  includeDeleted = false,
}: {
  taskId?: string;
  userId?: string;
  groupId?: string;
  includeDeleted?: boolean;
} = {}): Promise<TaskSubmission[]> => {
  const conditions = [];

  if (taskId) {
    conditions.push(where("taskId", "==", taskId));
  }
  if (userId) {
    conditions.push(where("userId", "==", userId));
  }
  if (groupId) {
    conditions.push(where("groupId", "==", groupId));
  }

  const q =
    conditions.length > 0
      ? query(
          collection(db, COLLECTION_NAME),
          ...conditions,
          orderBy("createdAt", "desc")
        )
      : query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => convertDocToSubmission(docSnap.id, docSnap.data()))
    .filter((submission) => (includeDeleted ? true : !submission.deletedAt));
};

export const getTaskSubmissionById = async (
  id: string
): Promise<TaskSubmission | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }

  const submission = convertDocToSubmission(docSnap.id, docSnap.data());
  if (submission.deletedAt) {
    return null;
  }

  return submission;
};

export const createTaskSubmission = async (
  payload: Omit<
    TaskSubmission,
    "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy"
  >
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const updateTaskSubmission = async (
  id: string,
  payload: Partial<
    Omit<
      TaskSubmission,
      "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy"
    >
  >
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const softDeleteTaskSubmission = async (
  id: string,
  userId: string
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
    deletedBy: userId,
    updatedAt: serverTimestamp(),
  });
};

