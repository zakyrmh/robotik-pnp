export type UserBlacklist = {
  id: string;
  user_id: string;
  admin_id: string;
  reason: string;
  evidence_url: string | null;
  is_permanent: boolean;
  expires_at: string | null;
  created_at: string;
};

export type UserBlacklistInsert = Omit<UserBlacklist, 'id' | 'created_at'> & {
  id?: string;
};

export type UserBlacklistUpdate = Partial<Omit<UserBlacklistInsert, 'user_id' | 'admin_id'>>;