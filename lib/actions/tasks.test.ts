import { vi, describe, it, expect, beforeEach } from "vitest";
import { createTask, submitTaskSubmission, gradeTaskSubmission } from "./tasks";

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

describe("Tasks LMS Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("should reject if user is not authorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

      const res = await createTask({ title: "Task 1", description: "Desc", dueDate: new Date().toISOString() });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
    });

    it("should successfully create task if user is authorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" } });
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { id: "new-task-id" } });

      const res = await createTask({ title: "Task 1", description: "Desc", dueDate: new Date().toISOString() });
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe("new-task-id");
    });
  });

  describe("submitTaskSubmission", () => {
    it("should reject if file type is invalid", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

      const formData = new FormData();
      formData.append("task_id", "task-id");
      formData.append("notes", "my notes");
      
      const blob = new Blob(["some content"], { type: "application/octet-stream" });
      const file = new File([blob], "virus.exe", { type: "application/octet-stream" });
      formData.append("file", file);

      const res = await submitTaskSubmission(formData);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INVALID_FILE_TYPE");
    });
  });

  describe("gradeTaskSubmission", () => {
    it("should reject if grade is out of bounds", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" } });

      const res = await gradeTaskSubmission("submission-id", 150, "Good job");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("BAD_REQUEST");
      expect(res.message).toContain("0 sampai 100");
    });
  });
});
