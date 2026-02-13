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
} from "@/schemas/internship";

const ROLLING_COLLECTION = "internship_rolling_registrations";
const DEPT_COLLECTION = "internship_department_registrations";

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
   * Delete Logbook Entry
   */
  async deleteLogbookEntry(
    logbookId: string,
    documentationUrls: string[],
  ): Promise<void> {
    if (documentationUrls?.length) {
      await Promise.all(documentationUrls.map((url) => deleteStorageFile(url)));
    }
    const ref = doc(db, "internship_logbooks", logbookId);
    await deleteDoc(ref);
  },

  /**
   * Get User Logbook Entries
   */
  async getLogbookEntries(userId: string): Promise<InternshipLogbookEntry[]> {
    const ref = collection(db, "internship_logbooks");
    const q = query(ref, where("userId", "==", userId));
    const snap = await getDocs(q);

    // Need to parse/convert timestamps manually or use converter
    return snap.docs.map((doc) => {
      const data = doc.data() as unknown as InternshipLogbookEntry & {
        date: Timestamp;
        createdAt: Timestamp;
        updatedAt: Timestamp;
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
      } as InternshipLogbookEntry;
    });
  },
};
