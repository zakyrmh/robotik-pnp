import { describe, expect, it } from "vitest";
import {
  isEventCommittee,
  resolveEventAwareNavigationRole,
} from "@/lib/event-rbac";

describe("event RBAC", () => {
  it.each([
    ["super-admin", null],
    ["anggota", "panitia-pendaftaran"],
    ["anggota", "panitia-verifikasi"],
    ["anggota", "panitia-pertandingan"],
  ])("mengizinkan role=%s role_event=%s", (role, roleEvent) => {
    expect(isEventCommittee(role, roleEvent)).toBe(true);
  });

  it("menolak role organisasi tanpa penugasan MRC", () => {
    expect(isEventCommittee("admin-or", null)).toBe(false);
    expect(isEventCommittee("anggota", null)).toBe(false);
  });

  it("memprioritaskan role_event untuk navigasi selain super-admin", () => {
    expect(
      resolveEventAwareNavigationRole("anggota", "panitia-verifikasi"),
    ).toBe("panitia-verifikasi");
    expect(resolveEventAwareNavigationRole("super-admin", null)).toBe(
      "super-admin",
    );
    expect(resolveEventAwareNavigationRole("anggota", null)).toBe("anggota");
  });
});
