import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Assignment, AssignmentSchema } from "@/schemas/assignments";

// =========================================================
// SERVICE FUNCTIONS
// =========================================================

/**
 * Submit an assignment (Student side)
 */
export async function submitAssignment(
  taskId: string,
  userId: string,
  submissionContent: string | undefined
): Promise<string> {
  try {
    // Check if assignment already exists
    const assignmentsRef = collection(db, "task_submissions");
    const q = query(
      assignmentsRef,
      where("taskId", "==", taskId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    const data = {
      taskId,
      userId,
      submissionContent,
      submittedAt: serverTimestamp(),
      status: "submitted",
      updatedAt: serverTimestamp(),
    };

    if (!snapshot.empty) {
      // Update existing
      const docId = snapshot.docs[0].id;
      const docRef = doc(db, "task_submissions", docId);
      await updateDoc(docRef, data);
      return docId;
    } else {
      // Create new
      const docRef = await addDoc(assignmentsRef, {
        ...data,
        createdAt: serverTimestamp(),
        // Initialize other fields
        score: 0,
        feedback: "",
        gradedBy: "",
        gradedAt: null,
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("[assignment-service] Error submitting assignment:", error);
    throw error;
  }
}

/**
 * Grade an assignment (Admin side)
 * Can handles cases where assignment doc doesn't exist yet (e.g. hidden tasks)
 */
export async function gradeAssignment(
  taskId: string,
  userId: string,
  score: number,
  feedback: string,
  graderId: string
): Promise<void> {
  try {
    const assignmentsRef = collection(db, "task_submissions");
    const q = query(
      assignmentsRef,
      where("taskId", "==", taskId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    const gradeData = {
      score,
      feedback,
      gradedBy: graderId,
      gradedAt: serverTimestamp(),
      status: "graded",
      updatedAt: serverTimestamp(),
    };

    if (!snapshot.empty) {
      // Update existing
      const docId = snapshot.docs[0].id;
      const docRef = doc(db, "task_submissions", docId);
      await updateDoc(docRef, gradeData);
    } else {
      // Create new (Admin grading directly without submission)
      await addDoc(assignmentsRef, {
        taskId,
        userId,
        ...gradeData,
        submissionContent: "",
        submittedAt: null, // Not submitted by user
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("[assignment-service] Error grading assignment:", error);
    throw error;
  }
}

/**
 * Get all assignments for a specific task
 */
export async function getAssignmentsByTask(
  taskId: string
): Promise<Assignment[]> {
  try {
    const assignmentsRef = collection(db, "task_submissions");
    const q = query(assignmentsRef, where("taskId", "==", taskId));
    const snapshot = await getDocs(q);

    const assignments: Assignment[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const parsed = AssignmentSchema.safeParse({
        id: docSnap.id,
        ...data,
      });
      if (parsed.success) {
        assignments.push(parsed.data);
      } else {
        // Log parsing error for debugging
        console.warn(
          `[assignment-service] Failed to parse assignment ${docSnap.id}:`,
          parsed.error.issues
        );
        console.warn(`[assignment-service] Raw data:`, data);

        // Still include the assignment with minimal data to not lose graded data
        // This is a fallback - the data structure should ideally always parse
        assignments.push({
          id: docSnap.id,
          taskId: data.taskId || taskId,
          userId: data.userId || "",
          status: data.status || "not_submitted",
          score: data.score ?? 0,
          feedback: data.feedback ?? "",
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          submissionContent: data.submissionContent,
          submittedAt: data.submittedAt?.toDate?.(),
          gradedBy: data.gradedBy,
          gradedAt: data.gradedAt?.toDate?.(),
        } as Assignment);
      }
    });

    return assignments;
  } catch (error) {
    console.error(
      `[assignment-service] Error fetching assignments for task ${taskId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get a user's assignment for a specific task
 */
export async function getUserAssignment(
  taskId: string,
  userId: string
): Promise<Assignment | null> {
  try {
    const assignmentsRef = collection(db, "task_submissions");
    const q = query(
      assignmentsRef,
      where("taskId", "==", taskId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      const parsed = AssignmentSchema.safeParse({
        id: docSnap.id,
        ...data,
      });
      if (parsed.success) return parsed.data;
    }
    return null;
  } catch (error) {
    console.error(
      "[assignment-service] Error fetching user assignment:",
      error
    );
    return null;
  }
}
