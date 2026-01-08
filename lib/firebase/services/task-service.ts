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
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Task, TaskSchema, TaskType, TaskStatus } from "@/schemas/tasks";

// =========================================================
// TYPES
// =========================================================

export interface TaskFilters {
  orPeriod?: string;
  taskType?: TaskType | "all";
  status?: TaskStatus | "all";
}

// =========================================================
// SERVICE FUNCTIONS
// =========================================================

/**
 * Fetch all tasks with optional filters
 */
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  try {
    const tasksRef = collection(db, "tasks");

    // Base query: order by createdAt desc
    // Note: Complex queries with multiple 'where' and 'orderBy' might require an index in Firestore
    let q = query(
      tasksRef,
      where("deletedAt", "==", null), // Only fetch non-deleted tasks
      orderBy("createdAt", "desc")
    );

    // Apply filters in memory if necessary or refine query
    // Firestore limitation: cannot chain multiple inequality filters or filter+sort on different fields without indices
    // For now, we fetch all active tasks and filter in memory for complex combinations if needed,
    // or rely on simple efficient queries.

    // Let's try to apply filters if they are provided and compatible
    if (filters?.orPeriod && filters.orPeriod !== "all") {
      q = query(q, where("orPeriod", "==", filters.orPeriod));
    }

    if (filters?.taskType && filters.taskType !== "all") {
      q = query(q, where("taskType", "==", filters.taskType));
    }

    if (filters?.status && filters.status !== "all") {
      q = query(q, where("status", "==", filters.status));
    }

    const snapshot = await getDocs(q);
    const tasks: Task[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Add ID to data for parsing
      const parsed = TaskSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        tasks.push(parsed.data);
      } else {
        console.warn(
          `[task-service] Invalid task data for ${docSnap.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return tasks;
  } catch (error) {
    console.error("[task-service] Error fetching tasks:", error);
    throw error;
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const docRef = doc(db, "tasks", taskId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const parsed = TaskSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        return parsed.data;
      } else {
        console.error(
          `[task-service] Invalid task data for ${taskId}:`,
          parsed.error.flatten()
        );
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error(`[task-service] Error fetching task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Create a new task
 */
export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">
): Promise<string> {
  try {
    const tasksRef = collection(db, "tasks");

    // Helper to cleanup undefined fields
    const cleanData = JSON.parse(JSON.stringify(data));

    const docRef = await addDoc(tasksRef, {
      ...cleanData,
      deletedAt: null,
      deletedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[task-service] Error creating task:", error);
    throw error;
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  try {
    const docRef = doc(db, "tasks", taskId);

    const updates: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updates);
  } catch (error) {
    console.error(`[task-service] Error updating task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Soft delete a task
 */
export async function deleteTask(
  taskId: string,
  deletedBy: string
): Promise<void> {
  try {
    const docRef = doc(db, "tasks", taskId);
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      deletedBy,
    });
  } catch (error) {
    console.error(`[task-service] Error deleting task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Get unique OR Periods from all tasks (for filter options)
 */
export async function getTaskOrPeriods(): Promise<string[]> {
  try {
    // Simplified approach: fetch all and extract.
    // For production with many docs, use an aggregation or separate metadata doc.
    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
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
    console.error("[task-service] Error fetching periods:", error);
    return [];
  }
}

/**
 * Get all soft-deleted tasks
 */
export async function getDeletedTasks(): Promise<Task[]> {
  try {
    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
      where("deletedAt", "!=", null),
      orderBy("deletedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const tasks: Task[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const parsed = TaskSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        tasks.push(parsed.data);
      } else {
        console.warn(
          `[task-service] Invalid deleted task data for ${docSnap.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return tasks;
  } catch (error) {
    console.error("[task-service] Error fetching deleted tasks:", error);
    throw error;
  }
}

/**
 * Restore a soft-deleted task
 */
export async function restoreTask(taskId: string): Promise<void> {
  try {
    const docRef = doc(db, "tasks", taskId);
    await updateDoc(docRef, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`[task-service] Error restoring task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Permanently delete a task (hard delete)
 * Also deletes all related assignments (task_submissions) with the same taskId
 */
export async function permanentDeleteTask(taskId: string): Promise<void> {
  try {
    const { deleteDoc } = await import("firebase/firestore");

    // 1. Delete all related assignments (task_submissions)
    const assignmentsRef = collection(db, "task_submissions");
    const assignmentsQuery = query(
      assignmentsRef,
      where("taskId", "==", taskId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    // Delete each assignment document
    const deleteAssignmentPromises = assignmentsSnapshot.docs.map((docSnap) => {
      return deleteDoc(doc(db, "task_submissions", docSnap.id));
    });

    await Promise.all(deleteAssignmentPromises);

    console.log(
      `[task-service] Deleted ${assignmentsSnapshot.size} assignments for task ${taskId}`
    );

    // 2. Delete the task document itself
    const taskDocRef = doc(db, "tasks", taskId);
    await deleteDoc(taskDocRef);

    console.log(`[task-service] Permanently deleted task ${taskId}`);
  } catch (error) {
    console.error(
      `[task-service] Error permanently deleting task ${taskId}:`,
      error
    );
    throw error;
  }
}
