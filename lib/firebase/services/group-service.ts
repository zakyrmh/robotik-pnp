import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  GroupParent,
  GroupParentSchema,
  SubGroup,
  SubGroupSchema,
} from "@/schemas/groups";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface GroupFilters {
  orPeriod?: string | "all";
  isActive?: boolean | "all";
}

export interface SubGroupFilters {
  parentId?: string;
  orPeriod?: string | "all";
  isActive?: boolean | "all";
}

// ---------------------------------------------------------
// GROUP PARENT OPERATIONS
// ---------------------------------------------------------

/**
 * Fetch all group parents with optional filters.
 * Excludes soft-deleted groups (deletedAt is set).
 */
export async function getGroupParents(
  filters: GroupFilters = {}
): Promise<GroupParent[]> {
  try {
    const groupsRef = collection(db, "group_parents");
    const constraints: Parameters<typeof query>[1][] = [];

    // Filter by OR Period
    if (filters.orPeriod && filters.orPeriod !== "all") {
      constraints.push(where("orPeriod", "==", filters.orPeriod));
    }

    // Filter by isActive status
    if (filters.isActive !== undefined && filters.isActive !== "all") {
      constraints.push(where("isActive", "==", filters.isActive));
    }

    // Order by createdAt descending
    constraints.push(orderBy("createdAt", "desc"));

    const q = query(groupsRef, ...constraints);
    const snapshot = await getDocs(q);

    const groups: GroupParent[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // Skip soft-deleted groups (deletedAt field exists)
      if (data.deletedAt) {
        return;
      }

      // Transform timestamps and validate with schema
      const parsed = GroupParentSchema.safeParse({
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt,
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : data.updatedAt,
        deletedAt:
          data.deletedAt instanceof Timestamp
            ? data.deletedAt.toDate()
            : undefined,
      });

      if (parsed.success) {
        groups.push(parsed.data);
      } else {
        console.warn("Invalid group data:", doc.id, parsed.error);
      }
    });

    return groups;
  } catch (error) {
    console.error("Error fetching group parents:", error);
    throw error;
  }
}

/**
 * Fetch unique OR periods from group parents.
 */
export async function getGroupOrPeriods(): Promise<string[]> {
  try {
    const groupsRef = collection(db, "group_parents");
    const snapshot = await getDocs(groupsRef);

    const periods = new Set<string>();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.orPeriod) {
        periods.add(data.orPeriod);
      }
    });

    return Array.from(periods).sort();
  } catch (error) {
    console.error("Error fetching group periods:", error);
    throw error;
  }
}

/**
 * Fetch a single Group Parent by ID.
 */
export async function getGroupParentById(
  groupId: string
): Promise<GroupParent | null> {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, "group_parents", groupId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    // Skip if soft-deleted
    if (data.deletedAt) {
      return null;
    }

    const parsed = GroupParentSchema.safeParse({
      id: docSnap.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
      deletedAt: undefined,
    });

    if (parsed.success) {
      return parsed.data;
    } else {
      console.warn("Invalid group data:", groupId, parsed.error);
      return null;
    }
  } catch (error) {
    console.error("Error fetching group parent:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// SUB-GROUP OPERATIONS
// ---------------------------------------------------------

/**
 * Fetch sub-groups with optional filters.
 * Excludes soft-deleted sub-groups.
 */
export async function getSubGroups(
  filters: SubGroupFilters = {}
): Promise<SubGroup[]> {
  try {
    const subGroupsRef = collection(db, "sub_groups");
    const constraints: Parameters<typeof query>[1][] = [];

    // Filter by parent ID
    if (filters.parentId) {
      constraints.push(where("parentId", "==", filters.parentId));
    }

    // Filter by OR Period
    if (filters.orPeriod && filters.orPeriod !== "all") {
      constraints.push(where("orPeriod", "==", filters.orPeriod));
    }

    // Filter by isActive status
    if (filters.isActive !== undefined && filters.isActive !== "all") {
      constraints.push(where("isActive", "==", filters.isActive));
    }

    // Order by createdAt descending
    constraints.push(orderBy("createdAt", "desc"));

    const q = query(subGroupsRef, ...constraints);
    const snapshot = await getDocs(q);

    const subGroups: SubGroup[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // Skip soft-deleted sub-groups (deletedAt field exists)
      if (data.deletedAt) {
        return;
      }

      // Transform timestamps and validate with schema
      const parsed = SubGroupSchema.safeParse({
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt,
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : data.updatedAt,
        deletedAt:
          data.deletedAt instanceof Timestamp
            ? data.deletedAt.toDate()
            : undefined,
      });

      if (parsed.success) {
        subGroups.push(parsed.data);
      } else {
        console.warn("Invalid sub-group data:", doc.id, parsed.error);
      }
    });

    return subGroups;
  } catch (error) {
    console.error("Error fetching sub-groups:", error);
    throw error;
  }
}

/**
 * Fetch sub-groups by parent ID.
 */
export async function getSubGroupsByParent(
  parentId: string
): Promise<SubGroup[]> {
  return getSubGroups({ parentId });
}

// ---------------------------------------------------------
// CREATE OPERATIONS
// ---------------------------------------------------------

/**
 * Input type for creating a new Group Parent.
 * Excludes system-generated fields like id, createdAt, updatedAt, deletedAt.
 */
export interface CreateGroupParentInput {
  name: string;
  description?: string;
  orPeriod: string;
  isActive?: boolean;
  createdBy: string;
}

/**
 * Create a new Group Parent.
 * Returns the ID of the newly created document.
 */
export async function createGroupParent(
  data: CreateGroupParentInput
): Promise<string> {
  try {
    const groupsRef = collection(db, "group_parents");

    const docRef = await addDoc(groupsRef, {
      name: data.name,
      description: data.description || "",
      orPeriod: data.orPeriod,
      isActive: data.isActive ?? true,
      totalSubGroups: 0,
      totalMembers: 0,
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("[group-service] Created group parent:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[group-service] Error creating group parent:", error);
    throw error;
  }
}

/**
 * Input type for updating a Group Parent.
 * All fields are optional except the ones you want to update.
 */
export interface UpdateGroupParentInput {
  name?: string;
  description?: string;
  orPeriod?: string;
  isActive?: boolean;
}

/**
 * Update an existing Group Parent.
 */
export async function updateGroupParent(
  groupId: string,
  data: UpdateGroupParentInput
): Promise<void> {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const docRef = doc(db, "group_parents", groupId);

    const updates: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined values
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    await updateDoc(docRef, updates);
    console.log("[group-service] Updated group parent:", groupId);
  } catch (error) {
    console.error("[group-service] Error updating group parent:", error);
    throw error;
  }
}

/**
 * Update group parent leader
 */
export async function updateGroupParentLeader(
  groupId: string,
  leaderId: string
): Promise<void> {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const docRef = doc(db, "group_parents", groupId);

    await updateDoc(docRef, {
      leaderId,
      updatedAt: serverTimestamp(),
    });

    console.log("[group-service] Updated group parent leader:", groupId);
  } catch (error) {
    console.error("[group-service] Error updating group parent leader:", error);
    throw error;
  }
}

/**
 * Soft delete group parent
 */
export async function softDeleteGroupParent(
  groupId: string,
  deletedBy: string
): Promise<void> {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const docRef = doc(db, "group_parents", groupId);

    await updateDoc(docRef, {
      isActive: false,
      deletedAt: serverTimestamp(),
      deletedBy,
      updatedAt: serverTimestamp(),
    });

    console.log("[group-service] Soft deleted group parent:", groupId);
  } catch (error) {
    console.error("[group-service] Error soft deleting group parent:", error);
    throw error;
  }
}

/**
 * Get deleted group parents (soft deleted)
 */
/**
 * Get deleted group parents (soft deleted) with deleter name
 */
export async function getDeletedGroupParents(): Promise<
  (GroupParent & { deletedByName?: string })[]
> {
  try {
    const { collection, query, where, orderBy, getDocs, doc, getDoc } =
      await import("firebase/firestore");
    const groupsRef = collection(db, "group_parents");
    const q = query(
      groupsRef,
      where("deletedAt", "!=", null),
      orderBy("deletedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GroupParent[];

    // Fetch deletedBy user names
    const deletedByData = await Promise.all(
      groups.map(async (group) => {
        if (!group.deletedBy) return { ...group, deletedByName: "-" };

        try {
          const userRef = doc(db, "users_new", group.deletedBy);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const fullName =
              userData.profile?.fullName ||
              userData.profile?.nickname ||
              "Unknown User";
            return { ...group, deletedByName: fullName };
          }
        } catch (err) {
          console.error(`Error fetching user ${group.deletedBy}:`, err);
        }
        return { ...group, deletedByName: "Unknown" };
      })
    );

    return deletedByData;
  } catch (error) {
    console.error("[group-service] Error getting deleted groups:", error);
    throw error;
  }
}

/**
 * Restore deleted group parent
 */
export async function restoreGroupParent(groupId: string): Promise<void> {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const docRef = doc(db, "group_parents", groupId);

    await updateDoc(docRef, {
      isActive: true, // Make active again
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });

    console.log("[group-service] Restored group parent:", groupId);
  } catch (error) {
    console.error("[group-service] Error restoring group parent:", error);
    throw error;
  }
}

/**
 * Permanently delete group parent and its sub-groups
 */
export async function permanentDeleteGroupParent(
  groupId: string
): Promise<void> {
  try {
    const { doc, collection, query, where, getDocs, writeBatch } = await import(
      "firebase/firestore"
    );

    // 1. Delete all sub-groups first
    const subGroupsRef = collection(db, "sub_groups");
    const q = query(subGroupsRef, where("parentId", "==", groupId));
    const subGroupsSnapshot = await getDocs(q);

    const batch = writeBatch(db);
    subGroupsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 2. Delete the parent group
    const parentRef = doc(db, "group_parents", groupId);
    batch.delete(parentRef);

    await batch.commit();

    console.log(
      "[group-service] Permanently deleted group parent and sub-groups:",
      groupId
    );
  } catch (error) {
    console.error(
      "[group-service] Error permanently deleting group parent:",
      error
    );
    throw error;
  }
}

// ---------------------------------------------------------
// GENERATE SUB-GROUPS
// ---------------------------------------------------------

/**
 * Input for generating sub-groups automatically
 */
export interface GenerateSubGroupsInput {
  parentGroupId: string;
  orPeriod: string;
  groupCount: number;
  createdBy: string;
}

/**
 * Result of generating sub-groups
 */
export interface GenerateSubGroupsResult {
  createdCount: number;
  totalMembers: number;
  subGroupIds: string[];
}

/**
 * Caang data with attendance for sorting
 */
interface CaangWithAttendance {
  userId: string;
  fullName: string;
  nim: string;
  attendancePercentage: number;
  totalActivities: number;
  attendedActivities: number;
}

/**
 * Generate sub-groups automatically by distributing caang members
 * based on their attendance percentage (highest to lowest, round-robin distribution)
 */
export async function generateSubGroups(
  input: GenerateSubGroupsInput
): Promise<GenerateSubGroupsResult> {
  try {
    // 1. Fetch all active caang users
    const caangUsers = await fetchActiveCaangWithAttendance(input.orPeriod);

    if (caangUsers.length === 0) {
      throw new Error("Tidak ada caang aktif yang tersedia");
    }

    // 2. Sort by attendance percentage (highest first)
    const sortedCaang = caangUsers.sort(
      (a, b) => b.attendancePercentage - a.attendancePercentage
    );

    // 3. Distribute to groups using round-robin
    const groupCount = input.groupCount;
    const groups: CaangWithAttendance[][] = Array.from(
      { length: groupCount },
      () => []
    );

    sortedCaang.forEach((caang, index) => {
      const groupIndex = index % groupCount;
      groups[groupIndex].push(caang);
    });

    // 4. Create sub-groups in Firestore
    const subGroupIds: string[] = [];
    const subGroupsRef = collection(db, "sub_groups");

    for (let i = 0; i < groups.length; i++) {
      const members = groups[i];
      const memberIds = members.map((m) => m.userId);

      // Set first member as leader (highest attendance in the group)
      const leaderId = memberIds.length > 0 ? memberIds[0] : undefined;

      // Prepare member details for denormalized data
      const memberDetails = members.map((m) => ({
        userId: m.userId,
        fullName: m.fullName,
        nim: m.nim,
        attendancePercentage: m.attendancePercentage,
        totalActivities: m.totalActivities,
        attendedActivities: m.attendedActivities,
        isLowAttendance: m.attendancePercentage < 25,
      }));

      const docRef = await addDoc(subGroupsRef, {
        parentId: input.parentGroupId,
        name: `Kelompok ${i + 1}`,
        description: "",
        orPeriod: input.orPeriod,
        memberIds,
        leaderId,
        members: memberDetails,
        isActive: true,
        createdBy: input.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      subGroupIds.push(docRef.id);
    }

    // 5. Update parent group statistics
    const { doc, updateDoc } = await import("firebase/firestore");
    const parentRef = doc(db, "group_parents", input.parentGroupId);
    await updateDoc(parentRef, {
      totalSubGroups: groupCount,
      totalMembers: sortedCaang.length,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `[group-service] Generated ${groupCount} sub-groups with ${sortedCaang.length} members`
    );

    return {
      createdCount: groupCount,
      totalMembers: sortedCaang.length,
      subGroupIds,
    };
  } catch (error) {
    console.error("[group-service] Error generating sub-groups:", error);
    throw error;
  }
}

/**
 * Fetch active caang users with their attendance data
 */
async function fetchActiveCaangWithAttendance(
  orPeriod: string
): Promise<CaangWithAttendance[]> {
  try {
    // 1. Fetch all active caang users
    const usersRef = collection(db, "users_new");
    const usersQuery = query(
      usersRef,
      where("roles.isCaang", "==", true),
      where("isActive", "==", true)
    );
    const usersSnapshot = await getDocs(usersQuery);

    const users: { id: string; fullName: string; nim: string }[] = [];
    usersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const profile = data.profile || {};
      users.push({
        id: docSnap.id,
        fullName: profile.fullName || profile.nickname || "Unknown",
        nim: profile.nim || "-",
      });
    });

    if (users.length === 0) {
      return [];
    }

    // 2. Fetch attendances for the OR period
    const attendancesRef = collection(db, "attendances");
    const attendancesQuery = query(
      attendancesRef,
      where("orPeriod", "==", orPeriod)
    );
    const attendancesSnapshot = await getDocs(attendancesQuery);

    // Group attendances by userId
    const attendanceByUser = new Map<
      string,
      { present: number; late: number; total: number }
    >();

    // Get unique activity IDs to count total activities
    const activityIds = new Set<string>();

    attendancesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId;
      const status = data.status;
      const activityId = data.activityId;

      activityIds.add(activityId);

      if (!attendanceByUser.has(userId)) {
        attendanceByUser.set(userId, { present: 0, late: 0, total: 0 });
      }

      const userAttendance = attendanceByUser.get(userId)!;
      userAttendance.total++;

      if (status === "present") {
        userAttendance.present++;
      } else if (status === "late") {
        userAttendance.late++;
      }
    });

    const totalActivities = activityIds.size;

    // 3. Calculate attendance percentage for each user
    const result: CaangWithAttendance[] = users.map((user) => {
      const attendance = attendanceByUser.get(user.id);

      if (!attendance || totalActivities === 0) {
        return {
          userId: user.id,
          fullName: user.fullName,
          nim: user.nim,
          attendancePercentage: 0,
          totalActivities: totalActivities,
          attendedActivities: 0,
        };
      }

      // present = 100%, late = 75%
      const attendedWeight = attendance.present + attendance.late * 0.75;
      const attendancePercentage =
        totalActivities > 0 ? (attendedWeight / totalActivities) * 100 : 0;

      return {
        userId: user.id,
        fullName: user.fullName,
        nim: user.nim,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        totalActivities: totalActivities,
        attendedActivities: attendance.present + attendance.late,
      };
    });

    return result;
  } catch (error) {
    console.error(
      "[group-service] Error fetching caang with attendance:",
      error
    );
    throw error;
  }
}

/**
 * Get count of active caang users
 */
export async function getActiveCaangCount(): Promise<number> {
  try {
    const usersRef = collection(db, "users_new");
    const q = query(
      usersRef,
      where("roles.isCaang", "==", true),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("[group-service] Error counting active caang:", error);
    throw error;
  }
}

/**
 * Update sub-group leader
 */
export async function updateSubGroupLeader(
  subGroupId: string,
  leaderId: string
): Promise<void> {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const docRef = doc(db, "sub_groups", subGroupId);

    await updateDoc(docRef, {
      leaderId,
      updatedAt: serverTimestamp(),
    });

    console.log("[group-service] Updated sub-group leader:", subGroupId);
  } catch (error) {
    console.error("[group-service] Error updating sub-group leader:", error);
    throw error;
  }
}

/**
 * Caang user data for unassigned list
 */
export interface UnassignedCaang {
  userId: string;
  fullName: string;
  nim: string;
  attendancePercentage: number;
  totalActivities: number;
  attendedActivities: number;
  isLowAttendance: boolean;
}

/**
 * Get caang users who are not assigned to any sub-group in the parent group
 */
export async function getUnassignedCaang(
  parentGroupId: string,
  orPeriod: string
): Promise<UnassignedCaang[]> {
  try {
    // 1. Get all active caang users
    const usersRef = collection(db, "users_new");
    const usersQuery = query(
      usersRef,
      where("roles.isCaang", "==", true),
      where("isActive", "==", true)
    );
    const usersSnapshot = await getDocs(usersQuery);

    const allCaang: { id: string; fullName: string; nim: string }[] = [];
    usersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const profile = data.profile || {};
      allCaang.push({
        id: docSnap.id,
        fullName: profile.fullName || profile.nickname || "Unknown",
        nim: profile.nim || "-",
      });
    });

    // 2. Get all sub-groups for this parent and collect assigned member IDs
    const subGroupsRef = collection(db, "sub_groups");
    const subGroupsQuery = query(
      subGroupsRef,
      where("parentId", "==", parentGroupId)
    );
    const subGroupsSnapshot = await getDocs(subGroupsQuery);

    const assignedMemberIds = new Set<string>();
    subGroupsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const memberIds = data.memberIds || [];
      memberIds.forEach((id: string) => assignedMemberIds.add(id));
    });

    // 3. Filter unassigned caang
    const unassignedCaang = allCaang.filter(
      (u) => !assignedMemberIds.has(u.id)
    );

    if (unassignedCaang.length === 0) {
      return [];
    }

    // 4. Fetch attendance data for unassigned caang
    const attendancesRef = collection(db, "attendances");
    const attendancesQuery = query(
      attendancesRef,
      where("orPeriod", "==", orPeriod)
    );
    const attendancesSnapshot = await getDocs(attendancesQuery);

    // Group attendances by userId
    const attendanceByUser = new Map<
      string,
      { present: number; late: number; total: number }
    >();
    const activityIds = new Set<string>();

    attendancesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId;
      const status = data.status;
      const activityId = data.activityId;

      activityIds.add(activityId);

      if (!attendanceByUser.has(userId)) {
        attendanceByUser.set(userId, { present: 0, late: 0, total: 0 });
      }

      const userAttendance = attendanceByUser.get(userId)!;
      userAttendance.total++;

      if (status === "present") {
        userAttendance.present++;
      } else if (status === "late") {
        userAttendance.late++;
      }
    });

    const totalActivities = activityIds.size;

    // 5. Build result with attendance data
    const result: UnassignedCaang[] = unassignedCaang.map((user) => {
      const attendance = attendanceByUser.get(user.id);

      if (!attendance || totalActivities === 0) {
        return {
          userId: user.id,
          fullName: user.fullName,
          nim: user.nim,
          attendancePercentage: 0,
          totalActivities: totalActivities,
          attendedActivities: 0,
          isLowAttendance: true,
        };
      }

      const attendedWeight = attendance.present + attendance.late * 0.75;
      const attendancePercentage =
        totalActivities > 0 ? (attendedWeight / totalActivities) * 100 : 0;

      return {
        userId: user.id,
        fullName: user.fullName,
        nim: user.nim,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        totalActivities: totalActivities,
        attendedActivities: attendance.present + attendance.late,
        isLowAttendance: attendancePercentage < 25,
      };
    });

    // Sort by attendance percentage descending
    return result.sort(
      (a, b) => b.attendancePercentage - a.attendancePercentage
    );
  } catch (error) {
    console.error("[group-service] Error fetching unassigned caang:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// UPDATE SUB-GROUP MEMBERS
// ---------------------------------------------------------

/**
 * Input for updating sub-group members
 */
export interface SubGroupMemberUpdate {
  subGroupId: string;
  memberIds: string[];
  members: {
    userId: string;
    fullName: string;
    nim: string;
    attendancePercentage: number;
    totalActivities: number;
    attendedActivities: number;
    isLowAttendance: boolean;
  }[];
  leaderId?: string | null;
}

/**
 * Update members for multiple sub-groups (batch update)
 */
export async function updateSubGroupMembers(
  updates: SubGroupMemberUpdate[]
): Promise<void> {
  try {
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);

    for (const update of updates) {
      const docRef = doc(db, "sub_groups", update.subGroupId);
      batch.update(docRef, {
        memberIds: update.memberIds,
        members: update.members,
        leaderId: update.leaderId || null,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(
      `[group-service] Updated members for ${updates.length} sub-groups`
    );
  } catch (error) {
    console.error("[group-service] Error updating sub-group members:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// CREATE EMPTY SUB-GROUPS
// ---------------------------------------------------------

/**
 * Input for creating empty sub-groups
 */
export interface CreateEmptySubGroupsInput {
  parentGroupId: string;
  orPeriod: string;
  count: number;
  startingNumber: number;
  createdBy: string;
}

/**
 * Result of creating empty sub-groups
 */
export interface CreateEmptySubGroupsResult {
  createdCount: number;
  subGroupIds: string[];
}

/**
 * Create empty sub-groups (without members)
 */
export async function createEmptySubGroups(
  input: CreateEmptySubGroupsInput
): Promise<CreateEmptySubGroupsResult> {
  try {
    const subGroupIds: string[] = [];
    const subGroupsRef = collection(db, "sub_groups");

    // Use Timestamp.now() instead of serverTimestamp()
    // so the value is immediately available when reading back
    const now = Timestamp.now();

    for (let i = 0; i < input.count; i++) {
      const groupNumber = input.startingNumber + i;

      const docRef = await addDoc(subGroupsRef, {
        parentId: input.parentGroupId,
        name: `Kelompok ${groupNumber}`,
        description: "",
        orPeriod: input.orPeriod,
        memberIds: [],
        leaderId: null,
        members: [],
        isActive: true,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      });

      subGroupIds.push(docRef.id);
    }

    // Update parent group totalSubGroups
    const { doc, updateDoc, increment } = await import("firebase/firestore");
    const parentRef = doc(db, "group_parents", input.parentGroupId);
    await updateDoc(parentRef, {
      totalSubGroups: increment(input.count),
      updatedAt: serverTimestamp(),
    });

    console.log(`[group-service] Created ${input.count} empty sub-groups`);

    return {
      createdCount: input.count,
      subGroupIds,
    };
  } catch (error) {
    console.error("[group-service] Error creating empty sub-groups:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// DELETE SUB-GROUP (PERMANENT)
// ---------------------------------------------------------

/**
 * Delete a sub-group permanently
 */
export async function deleteSubGroup(
  subGroupId: string,
  parentGroupId: string
): Promise<void> {
  try {
    const { doc, deleteDoc, updateDoc, increment } = await import(
      "firebase/firestore"
    );

    // Delete the sub-group document
    const subGroupRef = doc(db, "sub_groups", subGroupId);
    await deleteDoc(subGroupRef);

    // Update parent group totalSubGroups
    const parentRef = doc(db, "group_parents", parentGroupId);
    await updateDoc(parentRef, {
      totalSubGroups: increment(-1),
      updatedAt: serverTimestamp(),
    });

    console.log(`[group-service] Deleted sub-group: ${subGroupId}`);
  } catch (error) {
    console.error("[group-service] Error deleting sub-group:", error);
    throw error;
  }
}
