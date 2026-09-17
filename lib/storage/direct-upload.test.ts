import { describe, it, expect, vi } from "vitest";
import { uploadDirectToSupabase } from "./direct-upload";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _file: File, _options: unknown) => {
          if (bucket === "error-bucket") {
            return { data: null, error: { message: "Storage permission denied" } };
          }
          return { data: { path: `${path}` }, error: null };
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${bucket}/${path}` },
        }),
      }),
    },
  }),
}));

describe("uploadDirectToSupabase Utility", () => {
  it("harus berhasil mengunggah file langsung ke Supabase Storage dan mengembalikan publicUrl", async () => {
    const fakeFile = new File(["dummy content"], "avatar.png", { type: "image/png" });
    const result = await uploadDirectToSupabase({
      file: fakeFile,
      bucket: "profiles",
      path: "user-123/avatar.png",
    });

    expect(result.success).toBe(true);
    expect(result.publicUrl).toBe("https://test.supabase.co/storage/v1/object/public/profiles/user-123/avatar.png");
    expect(result.path).toBe("user-123/avatar.png");
  });

  it("harus menangani error saat upload gagal", async () => {
    const fakeFile = new File(["dummy content"], "doc.pdf", { type: "application/pdf" });
    const result = await uploadDirectToSupabase({
      file: fakeFile,
      bucket: "error-bucket",
      path: "user-123/doc.pdf",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Storage permission denied");
  });
});
