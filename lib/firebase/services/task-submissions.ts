import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { TaskSubmission } from "@/types/tasks";

export const upsertGrade = async (
  taskId: string, 
  userId: string, 
  score: number,
  adminId: string
) => {
  // ID unik gabungan taskId dan userId agar satu user cuma punya 1 nilai per tugas
  const submissionId = `${taskId}_${userId}`; 
  const submissionRef = doc(db, "task_submissions", submissionId);

  const payload: Partial<TaskSubmission> = {
    id: submissionId,
    taskId,
    userId,
    score,
    gradedBy: adminId,
    gradedAt: Timestamp.now(),
    submittedAt: Timestamp.now(), // Dianggap submit saat dinilai
    updatedAt: Timestamp.now(),
    // Field lain default
  };

  // Gunakan setDoc dengan merge: true agar tidak menimpa data lain jika sudah ada
  await setDoc(submissionRef, payload, { merge: true });
};