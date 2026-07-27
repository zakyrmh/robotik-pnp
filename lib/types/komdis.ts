import type { Database } from "@/types/database.types";

export type DisciplinePointLog =
  Database["public"]["Tables"]["discipline_point_logs"]["Row"];
export type InsertDisciplinePointLog =
  Database["public"]["Tables"]["discipline_point_logs"]["Insert"];

export type Sanction = Database["public"]["Tables"]["sanctions"]["Row"];
export type InsertSanction =
  Database["public"]["Tables"]["sanctions"]["Insert"];

export type UserDisciplineSummary =
  Database["public"]["Views"]["v_user_discipline_summary"]["Row"];

export type AttendanceApprovalStatus = "pending" | "approved" | "rejected";
export type SanctionStatus = "active" | "cleared" | "resolved";
export type SPLevel = 1 | 2 | 3;
