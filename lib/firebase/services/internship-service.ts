import { doc, getDoc, setDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  RollingInternshipRegistrationSchema,
  DepartmentInternshipRegistrationSchema,
  type RollingInternshipRegistration,
  type DepartmentInternshipRegistration,
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
};
