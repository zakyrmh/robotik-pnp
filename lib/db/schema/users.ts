import type { UserStatus } from './enums';

export type User = {
  id: string;                  // uuid
  email: string;
  status: UserStatus;
  deleted_at: string | null;   // ISO timestamp
  created_at: string;
  updated_at: string;
};

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UserUpdate = Partial<UserInsert>;