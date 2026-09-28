import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PiketReportClient } from "./piket-report-client";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/piket", () => ({ submitPiketReport: vi.fn() }));

describe("PiketReportClient", () => {
  it("tidak menampilkan tautan verifikasi untuk anggota biasa", () => {
    render(
      <PiketReportClient
        profile={{
          id: "u1",
          email: "a@b.c",
          role: "anggota",
          is_onboarded: true,
        }}
        availablePeriods={["2026/2027"]}
        schedules={[]}
        myAssignments={[]}
        myLogs={[]}
        myFines={[]}
      />,
    );
    expect(screen.queryByText(/verifikasi/i)).toBeNull();
  });

  it("menampilkan judul modul lapor piket", () => {
    render(
      <PiketReportClient
        profile={{
          id: "u1",
          email: "a@b.c",
          role: "anggota",
          is_onboarded: true,
        }}
        availablePeriods={["2026/2027"]}
        schedules={[]}
        myAssignments={[]}
        myLogs={[]}
        myFines={[]}
      />,
    );
    expect(screen.getAllByText(/Piket Kebersihan/i).length).toBeGreaterThan(0);
  });
});
