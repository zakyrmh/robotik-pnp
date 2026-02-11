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
  Timestamp,
  DocumentData,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config";
import {
  ResearchLogbook,
  ResearchActivityCategory,
  LogbookStatus,
  LogbookHistory,
  LogbookChangeField,
  LogbookHistoryAction,
} from "@/schemas/research-logbook";
import { KriTeam } from "@/schemas/users";

const COLLECTION_NAME = "research_logbooks";
const HISTORY_SUBCOLLECTION = "history_logbook";

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Convert Firestore document to ResearchLogbook type
 */
function docToLogbook(doc: DocumentData): ResearchLogbook {
  const data = doc.data();
  return {
    id: doc.id,
    team: data.team,
    authorId: data.authorId,
    authorName: data.authorName,
    collaboratorIds: data.collaboratorIds || [],
    activityDate: data.activityDate?.toDate() || new Date(),
    title: data.title,
    category: data.category,
    description: data.description,
    achievements: data.achievements,
    challenges: data.challenges,
    nextPlan: data.nextPlan,
    durationHours: data.durationHours,
    attachments: data.attachments?.map(
      (att: { uploadedAt: { toDate: () => Date } }) => ({
        ...att,
        uploadedAt: att.uploadedAt?.toDate() || new Date(),
      }),
    ),
    status: data.status,
    comments: data.comments?.map(
      (c: {
        createdAt: { toDate: () => Date };
        updatedAt?: { toDate: () => Date };
      }) => ({
        ...c,
        createdAt: c.createdAt?.toDate() || new Date(),
        updatedAt: c.updatedAt?.toDate(),
      }),
    ),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate(),
    deletedBy: data.deletedBy,
  };
}

/**
 * Generate differences between old and new data
 */
function generateDiff(
  oldData: ResearchLogbook,
  newData: UpdateLogbookData,
): LogbookChangeField[] {
  const changes: LogbookChangeField[] = [];
  const fieldsToCheck: (keyof UpdateLogbookData)[] = [
    "title",
    "category",
    "description",
    "achievements",
    "challenges",
    "nextPlan",
    "durationHours",
    "status",
    "activityDate",
  ];

  fieldsToCheck.forEach((field) => {
    // Skip if field is not in newData (undefined)
    if (newData[field] === undefined) return;

    const oldValue = oldData[field];
    const newValue = newData[field];

    // Handle Date comparison specifically
    if (field === "activityDate") {
      if (
        oldValue instanceof Date &&
        newValue instanceof Date &&
        oldValue.getTime() !== newValue.getTime()
      ) {
        changes.push({
          field,
          oldValue: oldValue.toISOString(),
          newValue: newValue.toISOString(),
        });
      }
      return;
    }

    // Handle primitive comparison
    if (oldValue !== newValue) {
      changes.push({
        field,
        oldValue,
        newValue,
      });
    }
  });

  return changes;
}

// ---------------------------------------------------------
// READ OPERATIONS
// ---------------------------------------------------------

export interface GetLogbooksParams {
  team: KriTeam;
  status?: LogbookStatus;
  category?: ResearchActivityCategory;
  authorId?: string;
  startDate?: Date;
  endDate?: Date;
  limitCount?: number;
  trashed?: boolean; // New parameter
  // Access Control Params
  currentUserId?: string;
  userRolePosition?: string; // 'ketua_tim', 'wakil_ketua_tim', etc.
}

/**
 * Get logbooks filtered by team and optional parameters
 * Users should only see logbooks from their assigned KRI team
 */
export async function getLogbooks(
  params: GetLogbooksParams,
): Promise<ResearchLogbook[]> {
  try {
    const logbooksRef = collection(db, COLLECTION_NAME);

    // Build base query
    // distinct query for trashed vs active to avoid complex index requirements if possible
    let q;

    if (params.trashed) {
      q = query(
        logbooksRef,
        where("team", "==", params.team),
        where("deletedAt", "!=", null),
        orderBy("deletedAt", "desc"),
      );
    } else {
      q = query(
        logbooksRef,
        where("team", "==", params.team),
        where("deletedAt", "==", null),
        orderBy("activityDate", "desc"),
      );
    }

    const snapshot = await getDocs(q);
    let logbooks = snapshot.docs.map(docToLogbook);

    // Apply Access Control Filtering
    if (params.currentUserId) {
      logbooks = logbooks.filter((log) => {
        const isAuthor = log.authorId === params.currentUserId;
        const isCollaborator = log.collaboratorIds?.includes(
          params.currentUserId!,
        );

        // Determine if user has access
        if (isAuthor || isCollaborator) return true;

        // Everyone else sees submitted (published) logbooks
        return log.status === "submitted";
      });
    }

    // Apply client-side filtering for optional parameters
    if (params.status) {
      logbooks = logbooks.filter((l) => l.status === params.status);
    }

    if (params.category) {
      logbooks = logbooks.filter((l) => l.category === params.category);
    }

    if (params.authorId) {
      logbooks = logbooks.filter((l) => l.authorId === params.authorId);
    }

    if (params.startDate) {
      logbooks = logbooks.filter((l) => {
        const activityDate =
          l.activityDate instanceof Date ? l.activityDate : new Date();
        return activityDate >= params.startDate!;
      });
    }

    if (params.endDate) {
      logbooks = logbooks.filter((l) => {
        const activityDate =
          l.activityDate instanceof Date ? l.activityDate : new Date();
        return activityDate <= params.endDate!;
      });
    }

    // Apply limit if specified
    if (params.limitCount) {
      logbooks = logbooks.slice(0, params.limitCount);
    }

    return logbooks;
  } catch (error) {
    console.error("Error fetching logbooks:", error);
    throw error;
  }
}

/**
 * Get a single logbook by ID
 */
export async function getLogbookById(
  id: string,
): Promise<ResearchLogbook | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docToLogbook(docSnap);
  } catch (error) {
    console.error("Error fetching logbook:", error);
    throw error;
  }
}

/**
 * Get history of a logbook
 */
export async function getLogbookHistory(
  logbookId: string,
): Promise<LogbookHistory[]> {
  try {
    const historyRef = collection(
      db,
      COLLECTION_NAME,
      logbookId,
      HISTORY_SUBCOLLECTION,
    );
    const q = query(historyRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }) as LogbookHistory,
    );
  } catch (error) {
    console.error("Error fetching logbook history:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// WRITE OPERATIONS
// ---------------------------------------------------------

export interface CreateLogbookData {
  team: KriTeam;
  authorId: string;
  authorName: string;
  collaboratorIds?: string[];
  activityDate: Date;
  title: string;
  category: ResearchActivityCategory;
  description: string;
  achievements?: string;
  challenges?: string;
  nextPlan?: string;
  durationHours?: number;
  status?: LogbookStatus;
}

/**
 * Create a new logbook entry
 */
export async function createLogbook(data: CreateLogbookData): Promise<string> {
  try {
    const now = Timestamp.now();
    const collaboratorIds = data.collaboratorIds || [];

    const logbookData = {
      ...data,
      collaboratorIds,
      activityDate: Timestamp.fromDate(data.activityDate),
      status: data.status || "draft",
      attachments: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedBy: null,
    };

    // Create main document
    const docRef = await addDoc(collection(db, COLLECTION_NAME), logbookData);

    // Add initial history entry
    const historyEntry = {
      logbookId: docRef.id,
      authorId: data.authorId,
      authorName: data.authorName,
      timestamp: now,
      action: "create",
      description: "Logbook created",
    };

    await addDoc(
      collection(db, COLLECTION_NAME, docRef.id, HISTORY_SUBCOLLECTION),
      historyEntry,
    );

    return docRef.id;
  } catch (error) {
    console.error("Error creating logbook:", error);
    throw error;
  }
}

export interface UpdateLogbookData {
  activityDate?: Date;
  title?: string;
  category?: ResearchActivityCategory;
  description?: string;
  achievements?: string;
  challenges?: string;
  nextPlan?: string;
  durationHours?: number;
  status?: LogbookStatus;
  collaboratorIds?: string[];
}

/**
 * Update an existing logbook entry with history logging
 */
export async function updateLogbook(
  id: string,
  data: UpdateLogbookData,
  updatedBy: { id: string; name: string },
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const oldDocSnap = await getDoc(docRef);

    if (!oldDocSnap.exists()) {
      throw new Error("Logbook not found");
    }

    const oldData = docToLogbook(oldDocSnap);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert date if provided
    if (data.activityDate) {
      updateData.activityDate = Timestamp.fromDate(data.activityDate);
    }

    // Determine action type
    let action: LogbookHistoryAction = "update";
    if (data.status && data.status !== oldData.status) {
      action = "status_change";
    }

    // Generate diff
    const changes = generateDiff(oldData, data);

    // Only update and log if there are changes or specific fields are updated/added
    if (
      changes.length > 0 ||
      (data.collaboratorIds &&
        JSON.stringify(data.collaboratorIds) !==
          JSON.stringify(oldData.collaboratorIds))
    ) {
      await updateDoc(docRef, updateData);

      // Create history entry
      const historyEntry = {
        logbookId: id,
        authorId: updatedBy.id,
        authorName: updatedBy.name,
        timestamp: Timestamp.now(),
        action,
        changes: changes.length > 0 ? changes : undefined,
        description:
          action === "status_change"
            ? `Status changed from ${oldData.status} to ${data.status}`
            : "Logbook updated",
      };

      await addDoc(
        collection(db, COLLECTION_NAME, id, HISTORY_SUBCOLLECTION),
        historyEntry,
      );
    }
  } catch (error) {
    console.error("Error updating logbook:", error);
    throw error;
  }
}

/**
 * Invite a collaborator to a logbook
 */
export async function inviteCollaborator(
  logbookId: string,
  collaboratorId: string,
  invitedBy: { id: string; name: string },
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, logbookId);

    await updateDoc(docRef, {
      collaboratorIds: arrayUnion(collaboratorId),
      updatedAt: Timestamp.now(),
    });

    // Add history entry
    const historyEntry = {
      logbookId,
      authorId: invitedBy.id,
      authorName: invitedBy.name,
      timestamp: Timestamp.now(),
      action: "invite",
      description: `Invited collaborator (ID: ${collaboratorId})`,
    };

    await addDoc(
      collection(db, COLLECTION_NAME, logbookId, HISTORY_SUBCOLLECTION),
      historyEntry,
    );
  } catch (error) {
    console.error("Error inviting collaborator:", error);
    throw error;
  }
}

/**
 * Soft delete a logbook entry
 */
export async function deleteLogbook(
  id: string,
  deletedBy: { id: string; name: string },
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    await updateDoc(docRef, {
      deletedAt: Timestamp.now(),
      deletedBy: deletedBy.id, // Store ID for query/reference
      updatedAt: Timestamp.now(),
    });

    // Add history entry
    const historyEntry = {
      logbookId: id,
      authorId: deletedBy.id,
      authorName: deletedBy.name,
      timestamp: Timestamp.now(),
      action: "delete",
      description: "Logbook moved to trash",
    };

    await addDoc(
      collection(db, COLLECTION_NAME, id, HISTORY_SUBCOLLECTION),
      historyEntry,
    );
  } catch (error) {
    console.error("Error deleting logbook:", error);
    throw error;
  }
}

/**
 * Restore a soft-deleted logbook entry
 */
export async function restoreLogbook(
  id: string,
  restoredBy: { id: string; name: string },
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    await updateDoc(docRef, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: Timestamp.now(),
    });

    // Add history entry
    const historyEntry = {
      logbookId: id,
      authorId: restoredBy.id,
      authorName: restoredBy.name,
      timestamp: Timestamp.now(),
      action: "restore",
      description: "Logbook restored from trash",
    };

    await addDoc(
      collection(db, COLLECTION_NAME, id, HISTORY_SUBCOLLECTION),
      historyEntry,
    );
  } catch (error) {
    console.error("Error restoring logbook:", error);
    throw error;
  }
}

/**
 * Permanently delete a logbook entry
 * This cannot be undone
 */
export async function permanentDeleteLogbook(id: string): Promise<void> {
  try {
    // Note: Subcollections (history) are NOT automatically deleted in Firestore
    // We should delete them manually if we want to clean up completely
    // OR we just leave them as orphaned records if that's acceptable policy.
    // Ideally use a recursive delete or cloud function.
    // For this client implementation, we'll try to delete history first then the doc.

    // Deleting subcollection from client is bit heavy (need to list all docs).
    // Let's just delete the main doc for now. Firestore rules/functions usually handle cleanup.
    // Or if we must, we list and delete.

    // Simple implementation: delete the document.
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error permanently deleting logbook:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// STATISTICS
// ---------------------------------------------------------

export interface LogbookStats {
  totalEntries: number;
  entriesByStatus: Record<LogbookStatus, number>;
  entriesByCategory: Record<ResearchActivityCategory, number>;
  totalHours: number;
}

/**
 * Get statistics for a team's logbooks
 */
export async function getLogbookStats(team: KriTeam): Promise<LogbookStats> {
  try {
    const logbooks = await getLogbooks({ team });

    const stats: LogbookStats = {
      totalEntries: logbooks.length,
      entriesByStatus: {
        draft: 0,
        submitted: 0,
      },
      entriesByCategory: {
        design: 0,
        fabrication: 0,
        assembly: 0,
        programming: 0,
        testing: 0,
        debugging: 0,
        documentation: 0,
        meeting: 0,
        training: 0,
        competition_prep: 0,
        other: 0,
      },
      totalHours: 0,
    };

    logbooks.forEach((log) => {
      stats.entriesByStatus[log.status]++;
      stats.entriesByCategory[log.category]++;
      if (log.durationHours) {
        stats.totalHours += log.durationHours;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error getting logbook stats:", error);
    throw error;
  }
}
