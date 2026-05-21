export type UserRole = "super-admin" | "admin-or" | "admin-komdis" | "anggota" | "caang";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

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
