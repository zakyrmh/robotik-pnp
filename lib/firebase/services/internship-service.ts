import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  QueryDocumentSnapshot,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { deleteStorageFile } from "@/lib/firebase/services/storage-service";
import {
  RollingInternshipRegistrationSchema,
  DepartmentInternshipRegistrationSchema,
  type RollingInternshipRegistration,
  type DepartmentInternshipRegistration,
  type InternshipLogbookEntry,
  type RollingInternshipSchedule,
  type RollingScheduleWeekEntry,
  type RollingScheduleConfig,
} from "@/schemas/internship";
import { type KriTeam } from "@/schemas/users";

const ROLLING_COLLECTION = "internship_rolling_registrations";
const DEPT_COLLECTION = "internship_department_registrations";
const SCHEDULE_COLLECTION = "internship_rolling_schedules";
const SCHEDULE_CONFIG_DOC = "rolling_schedule_config";

// All 5 KRI divisions
const ALL_DIVISIONS: KriTeam[] = [
  "krai",
  "krsbi_h",
  "krsbi_b",
  "krsti",
  "krsri",
];

// Converter helpers
const rollingConverter = {
  toFirestore: (data: RollingInternshipRegistration) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = data;
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return RollingInternshipRegistrationSchema.parse({
      id: snapshot.id,
      ...data,
      // Handle timestamps correctly
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      submittedAt: data.submittedAt?.toDate(),
    });
  },
};

const deptConverter = {
  toFirestore: (data: DepartmentInternshipRegistration) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = data;
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return DepartmentInternshipRegistrationSchema.parse({
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      submittedAt: data.submittedAt?.toDate(),
    });
  },
};

export const internshipService = {
  /**
   * Submit Rolling Internship Registration
   */
  async submitRollingInternship(
    userId: string,
    data: Omit<
      RollingInternshipRegistration,
      "id" | "userId" | "createdAt" | "updatedAt" | "submittedAt" | "status"
    >,
  ) {
    const ref = doc(db, ROLLING_COLLECTION, userId).withConverter(
      rollingConverter,
    );

    const registrationData: RollingInternshipRegistration = {
      ...data,
      userId,
      status: "submitted",
      id: userId,
      createdAt: new Date(), // Local date, parsed by converter or ignored if using serverTimestamp in helper
      updatedAt: new Date(),
      submittedAt: new Date(),
    };

    // Use setDoc to create or overwrite directly with generated ID (userId)
    await setDoc(ref, registrationData);
    return registrationData;
  },

  /**
   * Submit Department Internship Registration
   */
  async submitDepartmentInternship(
    userId: string,
    data: Omit<
      DepartmentInternshipRegistration,
      "id" | "userId" | "createdAt" | "updatedAt" | "submittedAt" | "status"
    >,
  ) {
    const ref = doc(db, DEPT_COLLECTION, userId).withConverter(deptConverter);

    const registrationData: DepartmentInternshipRegistration = {
      ...data,
      userId,
      status: "submitted",
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
    };

    await setDoc(ref, registrationData);
    return registrationData;
  },

  /**
   * Get Rolling Internship Status
   */
  async getRollingInternship(
    userId: string,
  ): Promise<RollingInternshipRegistration | null> {
    const ref = doc(db, ROLLING_COLLECTION, userId).withConverter(
      rollingConverter,
    );
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  /**
   * Get Department Internship Status
   */
  async getDepartmentInternship(
    userId: string,
  ): Promise<DepartmentInternshipRegistration | null> {
    const ref = doc(db, DEPT_COLLECTION, userId).withConverter(deptConverter);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  /**
   * Check if user has completed both registrations
   * Returns { rolling: boolean, department: boolean }
   */
  async checkRegistrationStatus(userId: string) {
    const [rolling, department] = await Promise.all([
      this.getRollingInternship(userId),
      this.getDepartmentInternship(userId),
    ]);

    return {
      hasRolling: !!rolling,
      hasDepartment: !!department,
      rollingData: rolling,
      departmentData: department,
    };
  },

  /**
   * Get ALL Rolling Internship Registrations
   */
  async getAllRollingInternships(): Promise<RollingInternshipRegistration[]> {
    const ref = collection(db, ROLLING_COLLECTION).withConverter(
      rollingConverter,
    );
    const snap = await getDocs(ref);
    return snap.docs.map((doc) => doc.data());
  },

  /**
   * Get ALL Department Internship Registrations
   */
  async getAllDepartmentInternships(): Promise<
    DepartmentInternshipRegistration[]
  > {
    const ref = collection(db, DEPT_COLLECTION).withConverter(deptConverter);
    const snap = await getDocs(ref);
    return snap.docs.map((doc) => doc.data());
  },

  /**
   * Add Logbook Entry
   */
  async addLogbookEntry(
    entry: Omit<InternshipLogbookEntry, "id">,
  ): Promise<InternshipLogbookEntry> {
    const ref = collection(db, "internship_logbooks");
    const docRef = await addDoc(ref, entry);
    // update with ID
    await setDoc(docRef, { ...entry, id: docRef.id });
    return { ...entry, id: docRef.id };
  },

  /**
   * Update Logbook Entry
   */
  async updateLogbookEntry(
    entry: InternshipLogbookEntry,
  ): Promise<InternshipLogbookEntry> {
    if (!entry.id) {
      throw new Error("Logbook ID is required for update");
    }
    const ref = doc(db, "internship_logbooks", entry.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateData } = entry;
    await setDoc(ref, { ...updateData, id: entry.id, updatedAt: new Date() });
    return entry;
  },

  /**
   * Soft Delete Logbook Entry (mark as deleted, keep files in storage)
   * Use this for draft deletion - files will be cleaned up on hard delete
   */
  async softDeleteLogbook(logbookId: string): Promise<void> {
    const ref = doc(db, "internship_logbooks", logbookId);
    await setDoc(
      ref,
      {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    );
  },

  /**
   * Hard Delete Logbook Entry (remove from database AND delete files from storage)
   * Use this for permanent deletion
   */
  async hardDeleteLogbook(
    logbookId: string,
    documentationUrls: string[],
  ): Promise<void> {
    // 1. Delete files from storage
    if (documentationUrls?.length) {
      await Promise.all(documentationUrls.map((url) => deleteStorageFile(url)));
    }
    // 2. Delete document from Firestore
    const ref = doc(db, "internship_logbooks", logbookId);
    await deleteDoc(ref);
  },

  /**
   * Restore Logbook Entry (remove deletedAt timestamp)
   */
  async restoreLogbook(logbookId: string): Promise<void> {
    const ref = doc(db, "internship_logbooks", logbookId);
    await setDoc(
      ref,
      {
        deletedAt: null,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  },

  /**
   * Get Deleted Logbook Entries (soft-deleted only)
   */
  async getDeletedLogbooks(userId: string): Promise<InternshipLogbookEntry[]> {
    const ref = collection(db, "internship_logbooks");
    const q = query(ref, where("userId", "==", userId));
    const snap = await getDocs(q);

    // Parse timestamps and filter for soft-deleted entries only
    return snap.docs
      .map((doc) => {
        const data = doc.data() as unknown as InternshipLogbookEntry & {
          date: Timestamp;
          createdAt: Timestamp;
          updatedAt: Timestamp;
          deletedAt?: Timestamp;
        };
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : new Date(data.updatedAt),
          deletedAt: data.deletedAt?.toDate
            ? data.deletedAt.toDate()
            : undefined,
        } as InternshipLogbookEntry;
      })
      .filter((entry) => entry.deletedAt); // Only deleted entries
  },

  /**
   * Delete Logbook Entry (Legacy - hard delete)
   * @deprecated Use hardDeleteLogbook instead
   */
  async deleteLogbookEntry(
    logbookId: string,
    documentationUrls: string[],
  ): Promise<void> {
    return this.hardDeleteLogbook(logbookId, documentationUrls);
  },

  /**
   * Get User Logbook Entries (excludes soft-deleted entries)
   */
  async getLogbookEntries(userId: string): Promise<InternshipLogbookEntry[]> {
    const ref = collection(db, "internship_logbooks");
    const q = query(ref, where("userId", "==", userId));
    const snap = await getDocs(q);

    // Parse timestamps and filter out soft-deleted entries
    return snap.docs
      .map((doc) => {
        const data = doc.data() as unknown as InternshipLogbookEntry & {
          date: Timestamp;
          createdAt: Timestamp;
          updatedAt: Timestamp;
          deletedAt?: Timestamp;
        };
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : new Date(data.updatedAt),
          deletedAt: data.deletedAt?.toDate
            ? data.deletedAt.toDate()
            : undefined,
        } as InternshipLogbookEntry;
      })
      .filter((entry) => !entry.deletedAt); // Exclude soft-deleted entries
  },

  // =========================================================
  // ROLLING SCHEDULE MANAGEMENT
  // =========================================================

  /**
   * Generate rolling schedule for a single user based on their registration.
   * - Week 1: user's chosen divisions (divisionChoice1, divisionChoice2)
   * - Remaining weeks: auto-rotate remaining divisions
   */
  generateScheduleForUser(
    userId: string,
    divisionChoice1: KriTeam,
    divisionChoice2: KriTeam,
    divisionsPerWeek: number = 2,
    startDate?: Date,
  ): Omit<RollingInternshipSchedule, "id" | "createdAt" | "updatedAt"> {
    // Build ordered division list:
    // Week 1 = [choice1, choice2], then remaining in default order
    const chosenDivisions: KriTeam[] = [divisionChoice1, divisionChoice2];
    const remainingDivisions = ALL_DIVISIONS.filter(
      (d) => !chosenDivisions.includes(d),
    );

    // All divisions in order: chosen first, then remaining
    const orderedDivisions = [...chosenDivisions, ...remainingDivisions];

    // Split into weekly chunks
    const weeks: RollingScheduleWeekEntry[] = [];
    let weekNumber = 1;
    let currentDate = startDate ? new Date(startDate) : undefined;

    for (let i = 0; i < orderedDivisions.length; i += divisionsPerWeek) {
      const weekDivisions = orderedDivisions.slice(i, i + divisionsPerWeek) as [
        KriTeam,
        ...KriTeam[],
      ];

      const weekEntry: RollingScheduleWeekEntry = {
        weekNumber,
        divisions: weekDivisions,
      };

      // Add dates if startDate is provided
      if (currentDate) {
        weekEntry.startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 6); // End of the week (7 days)
        weekEntry.endDate = endDate;
        // Move to next week
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 7);
      }

      weeks.push(weekEntry);
      weekNumber++;
    }

    const totalWeeks = weeks.length;

    return {
      userId,
      weeks,
      totalWeeks,
      divisionsPerWeek,
      primaryDivisionChoice: divisionChoice1,
      secondaryDivisionChoice: divisionChoice2,
      generatedBy: "system",
      scheduleStatus: "draft",
      currentWeek: 0,
    };
  },

  /**
   * Save a rolling schedule to Firestore
   */
  async saveRollingSchedule(
    schedule: Omit<RollingInternshipSchedule, "id" | "createdAt" | "updatedAt">,
  ): Promise<RollingInternshipSchedule> {
    const ref = doc(db, SCHEDULE_COLLECTION, schedule.userId);
    const now = new Date();

    const fullSchedule: RollingInternshipSchedule = {
      ...schedule,
      id: schedule.userId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(ref, fullSchedule);
    return fullSchedule;
  },

  /**
   * Generate and save rolling schedule for a single user
   */
  async generateRollingScheduleForUser(
    userId: string,
    divisionChoice1: KriTeam,
    divisionChoice2: KriTeam,
    divisionsPerWeek: number = 2,
    startDate?: Date,
  ): Promise<RollingInternshipSchedule> {
    const schedule = this.generateScheduleForUser(
      userId,
      divisionChoice1,
      divisionChoice2,
      divisionsPerWeek,
      startDate,
    );
    return this.saveRollingSchedule(schedule);
  },

  /**
   * Generate rolling schedules for ALL registered users (bulk)
   * Uses their divisionChoice1 and divisionChoice2 from rolling registration.
   */
  async generateAllRollingSchedules(
    divisionsPerWeek: number = 2,
    startDate?: Date,
  ): Promise<{ generated: number; skipped: number; errors: string[] }> {
    const rollingRegs = await this.getAllRollingInternships();
    let generated = 0;
    const errors: string[] = [];

    for (const reg of rollingRegs) {
      try {
        await this.generateRollingScheduleForUser(
          reg.userId,
          reg.divisionChoice1,
          reg.divisionChoice2,
          divisionsPerWeek,
          startDate,
        );
        generated++;
      } catch (error) {
        errors.push(
          `Failed for user ${reg.userId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return { generated, skipped: 0, errors };
  },

  /**
   * Get rolling schedule for a specific user
   */
  async getRollingSchedule(
    userId: string,
  ): Promise<RollingInternshipSchedule | null> {
    const ref = doc(db, SCHEDULE_COLLECTION, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : new Date(data.updatedAt),
      weeks: (data.weeks || []).map(
        (
          w: RollingScheduleWeekEntry & {
            startDate?: Timestamp;
            endDate?: Timestamp;
          },
        ) => ({
          ...w,
          startDate: w.startDate?.toDate
            ? (w.startDate as unknown as Timestamp).toDate()
            : w.startDate
              ? new Date(w.startDate as unknown as string)
              : undefined,
          endDate: w.endDate?.toDate
            ? (w.endDate as unknown as Timestamp).toDate()
            : w.endDate
              ? new Date(w.endDate as unknown as string)
              : undefined,
        }),
      ),
    } as RollingInternshipSchedule;
  },

  /**
   * Get ALL rolling schedules (admin view)
   */
  async getAllRollingSchedules(): Promise<RollingInternshipSchedule[]> {
    const ref = collection(db, SCHEDULE_COLLECTION);
    const snap = await getDocs(ref);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt),
        weeks: (data.weeks || []).map(
          (
            w: RollingScheduleWeekEntry & {
              startDate?: Timestamp;
              endDate?: Timestamp;
            },
          ) => ({
            ...w,
            startDate: w.startDate?.toDate
              ? (w.startDate as unknown as Timestamp).toDate()
              : w.startDate
                ? new Date(w.startDate as unknown as string)
                : undefined,
            endDate: w.endDate?.toDate
              ? (w.endDate as unknown as Timestamp).toDate()
              : w.endDate
                ? new Date(w.endDate as unknown as string)
                : undefined,
          }),
        ),
      } as RollingInternshipSchedule;
    });
  },

  /**
   * Update a rolling schedule (admin override)
   */
  async updateRollingSchedule(
    userId: string,
    updates: Partial<
      Pick<
        RollingInternshipSchedule,
        | "weeks"
        | "divisionsPerWeek"
        | "totalWeeks"
        | "scheduleStatus"
        | "currentWeek"
      >
    >,
    adminId: string,
  ): Promise<void> {
    const ref = doc(db, SCHEDULE_COLLECTION, userId);
    await setDoc(
      ref,
      {
        ...updates,
        generatedBy: "admin",
        modifiedByAdminId: adminId,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  },

  /**
   * Activate all draft schedules (set status to "active")
   */
  async activateAllSchedules(): Promise<number> {
    const schedules = await this.getAllRollingSchedules();
    let activated = 0;
    for (const schedule of schedules) {
      if (schedule.scheduleStatus === "draft") {
        const ref = doc(db, SCHEDULE_COLLECTION, schedule.userId);
        await setDoc(
          ref,
          {
            scheduleStatus: "active",
            currentWeek: 1,
            updatedAt: new Date(),
          },
          { merge: true },
        );
        activated++;
      }
    }
    return activated;
  },

  /**
   * Delete a rolling schedule
   */
  async deleteRollingSchedule(userId: string): Promise<void> {
    const ref = doc(db, SCHEDULE_COLLECTION, userId);
    await deleteDoc(ref);
  },

  /**
   * Get rolling schedule config
   */
  async getRollingScheduleConfig(): Promise<RollingScheduleConfig | null> {
    const ref = doc(db, "settings", SCHEDULE_CONFIG_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : new Date(data.updatedAt),
      internshipStartDate: data.internshipStartDate?.toDate
        ? data.internshipStartDate.toDate()
        : data.internshipStartDate
          ? new Date(data.internshipStartDate)
          : undefined,
    } as RollingScheduleConfig;
  },

  /**
   * Update rolling schedule config
   */
  async updateRollingScheduleConfig(
    config: Partial<RollingScheduleConfig>,
    adminId: string,
  ): Promise<void> {
    const ref = doc(db, "settings", SCHEDULE_CONFIG_DOC);
    await setDoc(
      ref,
      {
        ...config,
        updatedBy: adminId,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  },
};
