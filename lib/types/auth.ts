import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthState {
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
  } | null;
  profile: Profile | null;
}

export type RegisterState = {
  error?: string;
} | null;
