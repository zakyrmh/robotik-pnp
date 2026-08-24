/**
 * Unit Tests untuk User Management Server Actions
 * File: lib/actions/admin-users.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateUserIdentityAction,
  softDeleteUserAction,
  restoreUserAction,
  resetUserOnboardingAction,
  getUsersAction,
} from "./admin-users";

const SUPER_ADMIN_ID = "11111111-1111-4111-a111-111111111111";
const TARGET_USER_ID = "22222222-2222-4222-a222-222222222222";
const STUDY_PROG_ID = "33333333-3333-4333-a333-333333333333";

let mockUser: { id: string } | null = { id: SUPER_ADMIN_ID };
let mockRole = "super-admin";
let mockSuperAdminCount = 2;
let mockTargetProfileRole = "anggota";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn(async () => {}),
}));

const createMockSupabase = () => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: mockUser },
      error: mockUser ? null : { message: "No session" },
    })),
  },
  from: vi.fn((table: string) => {
    if (table === "profiles") {
      const queryChain: Record<string, unknown> = {
        select: vi.fn(
          (_cols?: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return {
                eq: vi.fn(() => ({
                  is: vi.fn(async () => ({
                    count: mockSuperAdminCount,
                    error: null,
                  })),
                })),
              };
            }
            return queryChain;
          },
        ),
        eq: vi.fn((_col: string, val: string) => ({
          single: vi.fn(async () => {
            if (val === SUPER_ADMIN_ID) {
              return {
                data: {
                  id: SUPER_ADMIN_ID,
                  role: mockRole,
                  full_name: "Super Admin User",
                  nim: "11111",
                  is_onboarded: true,
                  deleted_at: null,
                },
                error: null,
              };
            }
            return {
              data: {
                id: TARGET_USER_ID,
                role: mockTargetProfileRole,
                full_name: "Target Member User",
                nim: "22222",
                is_onboarded: true,
                deleted_at: null,
              },
              error: null,
            };
          }),
        })),
        is: vi.fn(() => queryChain),
        not: vi.fn(() => queryChain),
        or: vi.fn(() => queryChain),
        order: vi.fn(() => queryChain),
        range: vi.fn(async () => ({
          data: [
            {
              id: TARGET_USER_ID,
              email: "target@test.com",
              full_name: "Target Member User",
              nim: "22222",
              role: "anggota",
              is_onboarded: true,
              avatar_url: null,
              deleted_at: null,
              created_at: new Date().toISOString(),
              registrations: {
                phone_number: "081234567890",
                study_program_id: STUDY_PROG_ID,
                status: "verified",
                study_programs: { name: "Teknik Komputer" },
              },
            },
          ],
          count: 1,
          error: null,
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      };
      return queryChain;
    }

    if (table === "registrations") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                id: "reg-123",
                phone_number: "081234567890",
                study_program_id: STUDY_PROG_ID,
              },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
        insert: vi.fn(async () => ({ error: null })),
      };
    }

    if (table === "system_audit_logs") {
      return {
        insert: vi.fn(async () => ({ error: null })),
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(async () => ({
              data: [],
              count: 0,
              error: null,
            })),
          })),
        })),
      };
    }

    return {
      select: vi.fn(() => ({
        order: vi.fn(async () => ({ data: [], error: null })),
      })),
    };
  }),
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => createMockSupabase()),
  createAdminClient: vi.fn(() => createMockSupabase()),
}));

describe("Admin User Management Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: SUPER_ADMIN_ID };
    mockRole = "super-admin";
    mockSuperAdminCount = 2;
    mockTargetProfileRole = "anggota";
  });

  describe("updateUserIdentityAction", () => {
    it("should reject if caller is not authenticated", async () => {
      mockUser = null;
      await expect(
        updateUserIdentityAction({
          userId: TARGET_USER_ID,
          role: "admin-komdis",
          fullName: "Updated Name",
          isOnboarded: true,
        }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject if caller is not super-admin", async () => {
      mockRole = "admin-komdis";
      await expect(
        updateUserIdentityAction({
          userId: TARGET_USER_ID,
          role: "admin-komdis",
          fullName: "Updated Name",
          isOnboarded: true,
        }),
      ).rejects.toThrow("Forbidden");
    });

    it("should reject self-demotion when super admin demotes self", async () => {
      await expect(
        updateUserIdentityAction({
          userId: SUPER_ADMIN_ID,
          role: "anggota",
          fullName: "Super Admin User",
          isOnboarded: true,
        }),
      ).rejects.toThrow("Anda tidak dapat mencopot role Super Admin");
    });

    it("should reject demoting the last super admin in system", async () => {
      mockTargetProfileRole = "super-admin";
      mockSuperAdminCount = 1;

      await expect(
        updateUserIdentityAction({
          userId: TARGET_USER_ID,
          role: "admin-or",
          fullName: "Target Member User",
          isOnboarded: true,
        }),
      ).rejects.toThrow("Tidak dapat mengubah peran Super Admin terakhir");
    });

    it("should successfully update user identity and role", async () => {
      const res = await updateUserIdentityAction({
        userId: TARGET_USER_ID,
        role: "admin-komdis",
        fullName: "Updated Target Name",
        nim: "22222",
        phoneNumber: "081234567890",
        studyProgramId: STUDY_PROG_ID,
        isOnboarded: true,
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain("Berhasil memperbarui");
    });
  });

  describe("softDeleteUserAction", () => {
    it("should reject if super admin tries to soft delete themselves", async () => {
      await expect(
        softDeleteUserAction({
          userId: SUPER_ADMIN_ID,
          deleteReason: "Mengundurkan diri dari organisasi",
        }),
      ).rejects.toThrow("Anda tidak dapat menonaktifkan akun Anda sendiri.");
    });

    it("should reject soft deleting the last super admin", async () => {
      mockTargetProfileRole = "super-admin";
      mockSuperAdminCount = 1;

      await expect(
        softDeleteUserAction({
          userId: TARGET_USER_ID,
          deleteReason: "Testing soft delete last admin",
        }),
      ).rejects.toThrow("Tidak dapat menonaktifkan Super Admin terakhir");
    });

    it("should successfully soft delete a target user", async () => {
      const res = await softDeleteUserAction({
        userId: TARGET_USER_ID,
        deleteReason: "Akun telah lulus dari kampus",
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain("Berhasil menonaktifkan");
    });
  });

  describe("restoreUserAction & resetUserOnboardingAction", () => {
    it("should successfully restore a soft-deleted user", async () => {
      const res = await restoreUserAction({
        userId: TARGET_USER_ID,
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain("Berhasil memulihkan");
    });

    it("should successfully reset user onboarding status", async () => {
      const res = await resetUserOnboardingAction(TARGET_USER_ID);

      expect(res.success).toBe(true);
      expect(res.message).toContain("Berhasil mereset status onboarding");
    });
  });

  describe("getUsersAction", () => {
    it("should fetch paginated users data for super admin", async () => {
      const res = await getUsersAction({
        page: 1,
        perPage: 10,
        status: "all",
      });

      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data)).toBe(true);
    });
  });
});
