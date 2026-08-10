import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock server-only module for test environment
vi.mock("server-only", () => ({}));
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "@/lib/schemas/settings";

// Hoist mock for Supabase Server Client
const { mockSupabase, mockGetUser } = vi.hoisted(() => {
  const mockGetUser = vi.fn();

  const createQueryBuilder = () => {
    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      update: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      single: vi.fn(async () => ({
        data: { id: "user-123", full_name: "Test" },
        error: null,
      })),
      maybeSingle: vi.fn(async () => ({
        data: { id: "user-123", full_name: "Test" },
        error: null,
      })),
      order: vi.fn(() => builder),
      then: (resolve: (val: unknown) => void) =>
        resolve({ data: [], error: null }),
    };
    return builder;
  };

  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => createQueryBuilder()),
    update: vi.fn(() => createQueryBuilder()),
    insert: vi.fn(() => createQueryBuilder()),
    eq: vi.fn(() => createQueryBuilder()),
    select: vi.fn(() => createQueryBuilder()),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  return { mockSupabase, mockGetUser };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: () => "127.0.0.1",
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getSettingsDataAction,
  updateProfileAction,
  updateEmailAction,
  changePasswordAction,
  requestAccountDeletionAction,
  exportUserDataAction,
} from "./settings";

describe("Settings Zod Schemas Validation", () => {
  it("should validate updateProfileSchema correctly", () => {
    const validProfile = {
      full_name: "Budi Santoso",
      nickname: "Budi",
      gender: "L" as const,
      phone_number: "081234567890",
      entry_year: 2024,
    };
    const result = updateProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);

    const invalidProfile = {
      full_name: "A", // too short
      gender: "X",
    };
    const invalidResult = updateProfileSchema.safeParse(invalidProfile);
    expect(invalidResult.success).toBe(false);
  });

  it("should validate changePasswordSchema and check match", () => {
    const validPassword = {
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
      confirmNewPassword: "newpassword123",
    };
    expect(changePasswordSchema.safeParse(validPassword).success).toBe(true);

    const mismatchedPassword = {
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
      confirmNewPassword: "differentpassword",
    };
    const result = changePasswordSchema.safeParse(mismatchedPassword);
    expect(result.success).toBe(false);
  });

  it("should validate deleteAccountSchema confirmation text", () => {
    const validDelete = {
      currentPassword: "password123",
      deleteReason: "Ingin menonaktifkan akun sementara",
      confirmText: "SAYA INGIN MENGHAPUS AKUN",
    };
    expect(deleteAccountSchema.safeParse(validDelete).success).toBe(true);

    const invalidDelete = {
      currentPassword: "password123",
      deleteReason: "Rasa ragu",
      confirmText: "HAPUS AKUN SAYA",
    };
    expect(deleteAccountSchema.safeParse(invalidDelete).success).toBe(false);
  });
});

describe("Settings Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSettingsDataAction should return error if user is unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "No session" },
    });

    const res = await getSettingsDataAction();
    expect(res.error).toBe("Sesi tidak valid atau telah berakhir.");
  });

  it("updateProfileAction should return error if user is unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "No session" },
    });

    const res = await updateProfileAction({ full_name: "Test User" });
    expect(res.success).toBe(false);
    expect(res.message).toBe("Anda harus login terlebih dahulu.");
  });

  it("updateProfileAction should update profile successfully when authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: "reg-1" } });

    const res = await updateProfileAction({
      full_name: "Budi Santoso Updated",
      nickname: "Budi",
    });

    expect(res.success).toBe(true);
    expect(res.message).toBe("Profil berhasil diperbarui.");
  });

  it("updateEmailAction should fail if current password is wrong", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid credentials" },
    });

    const res = await updateEmailAction({
      currentPassword: "wrongpassword",
      newEmail: "new@example.com",
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe("Kata sandi saat ini salah.");
  });

  it("changePasswordAction should update password successfully", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockSupabase.auth.updateUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const res = await changePasswordAction({
      currentPassword: "correctpassword",
      newPassword: "newpassword123",
      confirmNewPassword: "newpassword123",
    });

    expect(res.success).toBe(true);
    expect(res.message).toBe("Kata sandi berhasil diperbarui.");
  });

  it("requestAccountDeletionAction should soft delete and log audit entry", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });
    mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

    const res = await requestAccountDeletionAction({
      currentPassword: "correctpassword",
      deleteReason: "Mengundurkan diri dari UKM",
      confirmText: "SAYA INGIN MENGHAPUS AKUN",
    });

    expect(res.success).toBe(true);
    expect(res.message).toBe("Akun Anda telah berhasil dinonaktifkan.");
  });

  it("exportUserDataAction should export all user data payload", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSupabase.maybeSingle
      .mockResolvedValueOnce({ data: { id: "user-123", full_name: "Test" } }) // profile
      .mockResolvedValueOnce({ data: { id: "reg-1", nickname: "Test" } }); // registration

    mockSupabase.select.mockResolvedValue({ data: [] });

    const res = await exportUserDataAction();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty("exported_at");
    expect(res.data).toHaveProperty("user");
  });
});
