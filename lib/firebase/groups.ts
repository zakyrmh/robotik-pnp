import { db } from '@/lib/firebaseConfig';
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
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { GroupParent, SubGroup, GroupMember } from '@/types/groups';
import { getUsers } from './users';
import { getAttendances } from './attendances';
import { getActivities } from './activities';
import { UserRole } from '@/types/enum';

const GROUP_PARENTS_COLLECTION = 'group_parents';
const SUB_GROUPS_COLLECTION = 'sub_groups';

/**
 * Convert Firestore document data to GroupParent type
 */
function convertDocToGroupParent(docId: string, data: Record<string, unknown>): GroupParent {
  return {
    id: docId,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
  } as GroupParent;
}

/**
 * Convert Firestore document data to SubGroup type
 */
function convertDocToSubGroup(docId: string, data: Record<string, unknown>): SubGroup {
  return {
    id: docId,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
  } as SubGroup;
}

// ============== GROUP PARENT OPERATIONS ==============

/**
 * Get all group parents
 */
export async function getGroupParents(orPeriod?: string): Promise<GroupParent[]> {
  try {
    let q = query(
      collection(db, GROUP_PARENTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    if (orPeriod) {
      q = query(
        collection(db, GROUP_PARENTS_COLLECTION),
        where('orPeriod', '==', orPeriod),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    
    const groupParents = snapshot.docs
      .map((doc) => convertDocToGroupParent(doc.id, doc.data()))
      .filter((gp) => gp.isActive);

    return groupParents;
  } catch (error) {
    console.error('Error getting group parents:', error);
    throw error;
  }
}

/**
 * Get group parent by ID
 */
export async function getGroupParentById(id: string): Promise<GroupParent | null> {
  try {
    const docRef = doc(db, GROUP_PARENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      if (!data.isActive) {
        return null;
      }
      
      return convertDocToGroupParent(docSnap.id, data);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting group parent by ID:', error);
    throw error;
  }
}

/**
 * Create a new group parent
 */
export async function createGroupParent(
  data: Omit<GroupParent, 'id' | 'createdAt' | 'updatedAt' | 'totalSubGroups' | 'totalMembers'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, GROUP_PARENTS_COLLECTION), {
      ...data,
      totalSubGroups: 0,
      totalMembers: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating group parent:', error);
    throw error;
  }
}

/**
 * Update a group parent
 */
export async function updateGroupParent(
  id: string,
  data: Partial<Omit<GroupParent, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, GROUP_PARENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating group parent:', error);
    throw error;
  }
}

/**
 * Soft delete a group parent (also marks all its sub-groups as inactive)
 */
export async function deleteGroupParent(id: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Mark parent as inactive
    const parentRef = doc(db, GROUP_PARENTS_COLLECTION, id);
    batch.update(parentRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
    
    // Mark all sub-groups as inactive
    const subGroupsQuery = query(
      collection(db, SUB_GROUPS_COLLECTION),
      where('parentId', '==', id)
    );
    const subGroupsSnapshot = await getDocs(subGroupsQuery);
    
    subGroupsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting group parent:', error);
    throw error;
  }
}

// ============== SUB-GROUP OPERATIONS ==============

/**
 * Get all sub-groups for a parent
 */
export async function getSubGroupsByParent(parentId: string): Promise<SubGroup[]> {
  try {
    const q = query(
      collection(db, SUB_GROUPS_COLLECTION),
      where('parentId', '==', parentId),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);
    
    const subGroups = snapshot.docs
      .map((doc) => convertDocToSubGroup(doc.id, doc.data()))
      .filter((sg) => sg.isActive);

    return subGroups;
  } catch (error) {
    console.error('Error getting sub-groups:', error);
    throw error;
  }
}

/**
 * Get sub-group by ID
 */
export async function getSubGroupById(id: string): Promise<SubGroup | null> {
  try {
    const docRef = doc(db, SUB_GROUPS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      if (!data.isActive) {
        return null;
      }
      
      return convertDocToSubGroup(docSnap.id, data);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting sub-group by ID:', error);
    throw error;
  }
}

/**
 * Create a new sub-group
 */
export async function createSubGroup(
  data: Omit<SubGroup, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const batch = writeBatch(db);
    
    // Create sub-group
    const subGroupRef = doc(collection(db, SUB_GROUPS_COLLECTION));
    batch.set(subGroupRef, {
      ...data,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update parent totalSubGroups and totalMembers
    const parentRef = doc(db, GROUP_PARENTS_COLLECTION, data.parentId);
    const parentSnap = await getDoc(parentRef);
    
    if (parentSnap.exists()) {
      const parentData = parentSnap.data() as GroupParent;
      batch.update(parentRef, {
        totalSubGroups: parentData.totalSubGroups + 1,
        totalMembers: parentData.totalMembers + data.memberIds.length,
        updatedAt: serverTimestamp(),
      });
    }
    
    await batch.commit();
    return subGroupRef.id;
  } catch (error) {
    console.error('Error creating sub-group:', error);
    throw error;
  }
}

/**
 * Update a sub-group
 */
export async function updateSubGroup(
  id: string,
  data: Partial<Omit<SubGroup, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Get current sub-group data
    const subGroupRef = doc(db, SUB_GROUPS_COLLECTION, id);
    const subGroupSnap = await getDoc(subGroupRef);
    
    if (!subGroupSnap.exists()) {
      throw new Error('Sub-group not found');
    }
    
    const currentData = subGroupSnap.data() as SubGroup;
    const oldMemberCount = currentData.memberIds.length;
    const newMemberCount = data.memberIds?.length ?? oldMemberCount;
    
    // Update sub-group
    batch.update(subGroupRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    // Update parent totalMembers if memberIds changed
    if (data.memberIds && newMemberCount !== oldMemberCount) {
      const parentRef = doc(db, GROUP_PARENTS_COLLECTION, currentData.parentId);
      const parentSnap = await getDoc(parentRef);
      
      if (parentSnap.exists()) {
        const parentData = parentSnap.data() as GroupParent;
        const memberDifference = newMemberCount - oldMemberCount;
        
        batch.update(parentRef, {
          totalMembers: parentData.totalMembers + memberDifference,
          updatedAt: serverTimestamp(),
        });
      }
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error updating sub-group:', error);
    throw error;
  }
}

/**
 * Delete a sub-group
 */
export async function deleteSubGroup(id: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Get sub-group data
    const subGroupRef = doc(db, SUB_GROUPS_COLLECTION, id);
    const subGroupSnap = await getDoc(subGroupRef);
    
    if (!subGroupSnap.exists()) {
      throw new Error('Sub-group not found');
    }
    
    const subGroupData = subGroupSnap.data() as SubGroup;
    
    // Mark sub-group as inactive
    batch.update(subGroupRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
    
    // Update parent totalSubGroups and totalMembers
    const parentRef = doc(db, GROUP_PARENTS_COLLECTION, subGroupData.parentId);
    const parentSnap = await getDoc(parentRef);
    
    if (parentSnap.exists()) {
      const parentData = parentSnap.data() as GroupParent;
      batch.update(parentRef, {
        totalSubGroups: Math.max(0, parentData.totalSubGroups - 1),
        totalMembers: Math.max(0, parentData.totalMembers - subGroupData.memberIds.length),
        updatedAt: serverTimestamp(),
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting sub-group:', error);
    throw error;
  }
}

// ============== HELPER FUNCTIONS ==============

/**
 * Calculate attendance percentage for a user
 */
export async function calculateUserAttendance(
  userId: string,
  orPeriod: string
): Promise<{ percentage: number; totalActivities: number; attendedActivities: number }> {
  try {
    // Get all activities for the period
    const activities = await getActivities();
    const periodActivities = activities.filter(a => a.orPeriod === orPeriod);
    const totalActivities = periodActivities.length;
    
    if (totalActivities === 0) {
      return { percentage: 0, totalActivities: 0, attendedActivities: 0 };
    }
    
    // Get user's attendances
    const attendances = await getAttendances({ userId, orPeriod });
    
    // Count attended (present or late)
    const attendedActivities = attendances.filter(
      a => a.status === 'present' || a.status === 'late'
    ).length;
    
    const percentage = (attendedActivities / totalActivities) * 100;
    
    return { percentage, totalActivities, attendedActivities };
  } catch (error) {
    console.error('Error calculating user attendance:', error);
    return { percentage: 0, totalActivities: 0, attendedActivities: 0 };
  }
}

/**
 * Get caang users with attendance data, sorted by attendance percentage
 */
export async function getCaangUsersWithAttendance(orPeriod: string): Promise<GroupMember[]> {
  try {
    // Get all users
    const usersResult = await getUsers();
    
    if (!usersResult.success || !usersResult.data) {
      throw new Error('Failed to get users');
    }
    
    // Filter caang users
    const caangUsers = usersResult.data.filter(
      user => user.role === UserRole.CAANG && user.isActive
    );
    
    // Calculate attendance for each user
    const usersWithAttendance: GroupMember[] = await Promise.all(
      caangUsers.map(async (user) => {
        const attendance = await calculateUserAttendance(user.id, orPeriod);
        
        return {
          userId: user.id,
          fullName: user.profile.fullName,
          nim: user.profile.nim,
          attendancePercentage: attendance.percentage,
          totalActivities: attendance.totalActivities,
          attendedActivities: attendance.attendedActivities,
          isLowAttendance: attendance.percentage < 25,
        };
      })
    );
    
    // Sort by attendance percentage (descending)
    usersWithAttendance.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    
    return usersWithAttendance;
  } catch (error) {
    console.error('Error getting caang users with attendance:', error);
    throw error;
  }
}

/**
 * Distribute users into groups evenly
 */
function distributeUsersIntoGroups(users: GroupMember[], numberOfGroups: number): GroupMember[][] {
  const groups: GroupMember[][] = Array.from({ length: numberOfGroups }, () => []);
  
  // Distribute users round-robin to balance groups
  users.forEach((user, index) => {
    const groupIndex = index % numberOfGroups;
    groups[groupIndex].push(user);
  });
  
  return groups;
}

/**
 * Generate group parent with sub-groups and auto-assign members
 */
export async function generateGroupParent(
  parentName: string,
  numberOfSubGroups: number,
  orPeriod: string,
  description: string,
  createdBy: string
): Promise<string> {
  try {
    // Get caang users with attendance data (already sorted by attendance)
    const caangUsers = await getCaangUsersWithAttendance(orPeriod);
    
    if (caangUsers.length === 0) {
      throw new Error('No caang users found for the specified period');
    }
    
    // Create group parent
    const parentId = await createGroupParent({
      name: parentName,
      description,
      orPeriod,
      isActive: true,
      createdBy,
    });
    
    // Distribute users into sub-groups
    const groupedUsers = distributeUsersIntoGroups(caangUsers, numberOfSubGroups);
    
    // Create sub-groups
    const batch = writeBatch(db);
    let totalMembers = 0;
    
    for (let i = 0; i < numberOfSubGroups; i++) {
      const groupMembers = groupedUsers[i];
      const memberIds = groupMembers.map(m => m.userId);
      
      const subGroupRef = doc(collection(db, SUB_GROUPS_COLLECTION));
      batch.set(subGroupRef, {
        parentId,
        name: `Kelompok ${i + 1}`,
        orPeriod,
        memberIds,
        members: groupMembers,
        isActive: true,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      totalMembers += memberIds.length;
    }
    
    // Update parent with totals
    const parentRef = doc(db, GROUP_PARENTS_COLLECTION, parentId);
    batch.update(parentRef, {
      totalSubGroups: numberOfSubGroups,
      totalMembers,
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    return parentId;
  } catch (error) {
    console.error('Error generating group parent:', error);
    throw error;
  }
}
