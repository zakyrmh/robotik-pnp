import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PiketHistoryClient } from "./piket-history-client";
import type { PiketComplianceRow, PiketHistoryLog } from "@/lib/repositories/piket";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: vi.fn() }),
  usePathname: () => "/piket/riwayat",
  useSearchParams: () => new URLSearchParams("tab=kepatuhan"),
}));

const baseProps = {
  profile: {
    id: "p-1",
    email: "anggota@b.c",
    role: "anggota",
    is_onboarded: true,
  },
  availablePeriods: ["2026/2027", "2025/2026"],
  activeFilter: {
    academicPeriod: "2026/2027",
    year: null as number | null,
    monthIndex0: null as number | null,
    weekNumber: null as number | null,
  },
};

const complianceFixture: PiketComplianceRow[] = [
  {
    profileId: "p-2",
    memberName: "Budi Alpha",
    nim: "210109002",
    academicPeriod: "2026/2027",
    weekNumber: 1,
    roomTarget: "Workshop",
    startIsoDate: "2026-06-29",
    endIsoDate: "2026-07-05",
    cycleMonthLabel: "Juli 2026",
    status: "alpha",
  },
];

const logFixture: PiketHistoryLog[] = [
  {
    id: "log-1",
    scheduleId: "sch-1",
    academicPeriod: "2026/2027",
    weekNumber: 1,
    roomTarget: "Workshop",
    dutyDate: "2026-06-30",
    reportedById: "p-3",
    reporterName: "Citra Petugas",
    reporterNim: "210109003",
    status: "approved",
    rejectionReason: "",
    verifiedAt: "2026-07-01T00:00:00.000Z",
    verifierName: "Kestari Satu",
    notes: "",
    proofImageUrl: "proofs/after.jpg",
    proofImageBeforeUrl: "proofs/before.jpg",
    createdAt: "2026-06-30T00:00:00.000Z",
  },
];

describe("PiketHistoryClient", () => {
  it("menampilkan judul/heading histori piket", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );
    expect(screen.getByText(/Riwayat Piket/i)).toBeTruthy();
  });

  it("tab Kepatuhan default menampilkan nama anggota & badge status", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );
    expect(screen.getByText("Budi Alpha")).toBeTruthy();
    expect(screen.getByText("ALPHA")).toBeTruthy();
  });

  it("klik tab Log menampilkan nama petugas dari logs", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Log$/i }));
    expect(screen.getByText("Citra Petugas")).toBeTruthy();
  });

  it("menampilkan ringkasan count per status di tab Kepatuhan", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );
    expect(
      screen.getByTestId("piket-history-summary-alpha").textContent,
    ).toContain("Alpha");
    expect(
      screen.getByTestId("piket-history-summary-berlangsung").textContent,
    ).toContain("Berlangsung");
    expect(
      screen.getByTestId("piket-history-summary-magang").textContent,
    ).toContain("Magang");
    expect(
      screen.getByTestId("piket-history-summary-sudah-lapor").textContent,
    ).toContain("Sudah Lapor");
  });

  it("perubahan periode memperbarui query lewat router.replace dan mempertahankan param lain", () => {
    replaceMock.mockClear();
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.change(screen.getByLabelText("Periode DPH"), {
      target: { value: "2025/2026" },
    });

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const [url] = replaceMock.mock.calls[0] as [string];
    expect(url).toContain("period=2025%2F2026");
    expect(url).toContain("tab=kepatuhan");
    expect(url.startsWith("/piket/riwayat?")).toBe(true);
  });

  it("perubahan tahun memperbarui query lewat router.replace dan mempertahankan param lain", () => {
    replaceMock.mockClear();
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.change(screen.getByLabelText("Tahun"), {
      target: { value: "2027" },
    });

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const [url] = replaceMock.mock.calls[0] as [string];
    expect(url).toContain("year=2027");
    expect(url).toContain("tab=kepatuhan");
  });
});
