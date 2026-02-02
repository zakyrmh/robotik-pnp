import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "../config";
import {
  ResearchLogbook,
  ResearchActivityCategory,
  LogbookStatus,
} from "@/schemas/research-logbook";
import { KriTeam } from "@/schemas/users";

const COLLECTION_NAME = "research_logbooks";

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

    // Build base query with team and deletedAt filters
    const q = query(
      logbooksRef,
      where("team", "==", params.team),
      where("deletedAt", "==", null),
      orderBy("activityDate", "desc"),
    );

    const snapshot = await getDocs(q);
    let logbooks = snapshot.docs.map(docToLogbook);

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

// ---------------------------------------------------------
// WRITE OPERATIONS
// ---------------------------------------------------------

export interface CreateLogbookData {
  team: KriTeam;
  authorId: string;
  authorName: string;
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

    const logbookData = {
      ...data,
      activityDate: Timestamp.fromDate(data.activityDate),
      status: data.status || "draft",
      attachments: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedBy: null,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), logbookData);
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
}

/**
 * Update an existing logbook entry
 */
export async function updateLogbook(
  id: string,
  data: UpdateLogbookData,
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert date if provided
    if (data.activityDate) {
      updateData.activityDate = Timestamp.fromDate(data.activityDate);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating logbook:", error);
    throw error;
  }
}

/**
 * Soft delete a logbook entry
 */
export async function deleteLogbook(
  id: string,
  deletedBy: string,
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    await updateDoc(docRef, {
      deletedAt: Timestamp.now(),
      deletedBy,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error deleting logbook:", error);
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
        needs_revision: 0,
        approved: 0,
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
