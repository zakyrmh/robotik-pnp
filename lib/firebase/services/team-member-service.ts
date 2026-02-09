import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  User,
  KriTeam,
  TeamManagementPosition,
  TeamTechnicalRole,
  CompetitionAssignment,
} from "@/schemas/users";

/**
 * Interface untuk anggota tim yang ditampilkan
 */
export interface TeamMember {
  id: string;
  fullName: string;
  photoUrl?: string;
  managementPosition: TeamManagementPosition;
  technicalRole: TeamTechnicalRole;
  isActive: boolean;
}

/**
 * Mendapatkan label untuk posisi manajemen
 */
export function getManagementPositionLabel(
  position: TeamManagementPosition,
): string {
  const labels: Record<TeamManagementPosition, string> = {
    chairman: "Ketua Tim",
    vice_chairman: "Wakil Ketua",
    secretary: "Sekretaris",
    treasurer: "Bendahara",
    member: "Anggota",
  };
  return labels[position];
}

/**
 * Mendapatkan label untuk role teknis
 */
export function getTechnicalRoleLabel(role: TeamTechnicalRole): string {
  const labels: Record<TeamTechnicalRole, string> = {
    mechanic: "Mekanikal",
    programmer: "Programmer",
    electronics: "Elektrikal",
  };
  return labels[role];
}

/**
 * Mendapatkan warna badge untuk posisi manajemen
 */
export function getManagementPositionColor(
  position: TeamManagementPosition,
): string {
  const colors: Record<TeamManagementPosition, string> = {
    chairman:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700",
    vice_chairman:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    secretary:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    treasurer:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    member:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
  };
  return colors[position];
}

/**
 * Mendapatkan warna badge untuk role teknis
 */
export function getTechnicalRoleColor(role: TeamTechnicalRole): string {
  const colors: Record<TeamTechnicalRole, string> = {
    mechanic:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    programmer:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    electronics:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
  };
  return colors[role];
}

/**
 * Mendapatkan urutan prioritas untuk sorting berdasarkan posisi manajemen
 */
function getPositionPriority(position: TeamManagementPosition): number {
  const priorities: Record<TeamManagementPosition, number> = {
    chairman: 1,
    vice_chairman: 2,
    secretary: 3,
    treasurer: 4,
    member: 5,
  };
  return priorities[position];
}

/**
 * Mengambil semua anggota dari tim KRI tertentu
 */
export async function getTeamMembers(team: KriTeam): Promise<TeamMember[]> {
  try {
    const usersRef = collection(db, "users_new");
    const q = query(usersRef, where("roles.isKRIMember", "==", true));

    const querySnapshot = await getDocs(q);
    const members: TeamMember[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as User;

      // Cek apakah user memiliki assignments
      if (!userData.assignments?.competitions) {
        return;
      }

      // Cari assignment yang sesuai dengan tim yang diminta
      const teamAssignment = userData.assignments.competitions.find(
        (comp: CompetitionAssignment) =>
          comp.team === team && comp.isActive === true,
      );

      if (teamAssignment) {
        members.push({
          id: doc.id,
          fullName: userData.profile.fullName,
          photoUrl: userData.profile.photoUrl,
          managementPosition: teamAssignment.managementPosition,
          technicalRole: teamAssignment.technicalRole,
          isActive: teamAssignment.isActive,
        });
      }
    });

    // Sort berdasarkan posisi manajemen (ketua dulu, dst)
    members.sort((a, b) => {
      const priorityDiff =
        getPositionPriority(a.managementPosition) -
        getPositionPriority(b.managementPosition);

      // Jika posisi sama, sort berdasarkan nama
      if (priorityDiff === 0) {
        return a.fullName.localeCompare(b.fullName);
      }

      return priorityDiff;
    });

    return members;
  } catch (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
}
