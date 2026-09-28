import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PiketVerificationClient } from "./piket-verification-client";
import { getPiketComplianceAction } from "@/lib/actions/piket";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/piket", () => ({
  reviewPiketLog: vi.fn(),
  imposePiketFine: vi.fn(),
  markPiketFinePaid: vi.fn(),
  voidPiketFine: vi.fn(),
  getPiketComplianceAction: vi.fn(),
}));

const baseProps = {
  profile: {
    id: "adm",
    email: "adm@b.c",
    role: "admin-kestari",
    is_onboarded: true,
  },
  availablePeriods: ["2026/2027"],
  logs: [],
  fines: [],
  schedules: [],
};

describe("PiketVerificationClient", () => {
  it("menampilkan tab kepatuhan", () => {
    render(<PiketVerificationClient {...baseProps} compliance={[]} />);
    expect(screen.getByText(/Kepatuhan/i)).toBeTruthy();
  });

  it("menampilkan baris kepatuhan dengan badge status", () => {
    render(
      <PiketVerificationClient
        {...baseProps}
        compliance={[
          {
            profileId: "p-2",
            memberName: "Budi Alpha",
            nim: "210109002",
            academicPeriod: "2026/2027",
            weekNumber: 1,
            roomTarget: "Workshop",
            startIsoDate: "2027-06-28",
            endIsoDate: "2027-07-04",
            cycleMonthLabel: "Juli 2026",
            status: "alpha",
          },
        ]}
      />,
    );

    // Before clicking the tab, the kepatuhan panel is inert (aria-hidden) and
    // the verifikasi panel is active.
    expect(
      screen.getByTestId("piket-kepatuhan-panel").getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      screen.getByTestId("piket-verifikasi-panel").getAttribute("aria-hidden"),
    ).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: /Kepatuhan/i }));

    // After clicking, the tab state flips: kepatuhan becomes active and
    // verifikasi becomes inert. This makes the click load-bearing.
    expect(
      screen.getByTestId("piket-kepatuhan-panel").getAttribute("aria-hidden"),
    ).toBe("false");
    expect(
      screen.getByTestId("piket-verifikasi-panel").getAttribute("aria-hidden"),
    ).toBe("true");

    expect(screen.getByText("Budi Alpha")).toBeTruthy();
    expect(screen.getByText("ALPHA")).toBeTruthy();
  });

  it("menampilkan label bulan siklus pada baris kepatuhan", () => {
    render(
      <PiketVerificationClient
        {...baseProps}
        compliance={[
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
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kepatuhan/i }));
    expect(screen.getByText("Juli 2026")).toBeTruthy();
  });

  it("menampilkan agregat Belum Piket dan filter cepat (spec §7.1/§7.4)", () => {
    render(
      <PiketVerificationClient
        {...baseProps}
        compliance={[
          {
            profileId: "p-1",
            memberName: "Andi Sudah",
            nim: "1",
            academicPeriod: "2026/2027",
            weekNumber: 1,
            roomTarget: "Workshop",
            startIsoDate: "2026-06-29",
            endIsoDate: "2026-07-05",
            cycleMonthLabel: "Juli 2026",
            status: "sudah-lapor",
          },
          {
            profileId: "p-2",
            memberName: "Budi Alpha",
            nim: "2",
            academicPeriod: "2026/2027",
            weekNumber: 1,
            roomTarget: "Workshop",
            startIsoDate: "2026-06-29",
            endIsoDate: "2026-07-05",
            cycleMonthLabel: "Juli 2026",
            status: "alpha",
          },
          {
            profileId: "p-3",
            memberName: "Citra Magang",
            nim: "3",
            academicPeriod: "2026/2027",
            weekNumber: 1,
            roomTarget: "Workshop",
            startIsoDate: "2026-06-29",
            endIsoDate: "2026-07-05",
            cycleMonthLabel: "Juli 2026",
            status: "magang",
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kepatuhan/i }));

    // Agregat: 2 orang belum piket (Budi + Citra), Andi sudah lapor.
    const aggregate = screen.getByTestId("piket-belum-piket");
    expect(aggregate.textContent).toContain("Belum Piket (2 orang)");
    expect(aggregate.textContent).toContain("Budi Alpha");
    expect(aggregate.textContent).toContain("Citra Magang");
    expect(aggregate.textContent).not.toContain("Andi Sudah");

    // Filter "Magang" menyembunyikan baris non-magang.
    fireEvent.click(screen.getByRole("button", { name: /^Magang$/i }));
    expect(screen.queryByText("Budi Alpha")).toBeNull();
    expect(screen.getAllByText("Citra Magang").length).toBeGreaterThan(0);
  });

  it("memanggil getPiketComplianceAction saat periode diganti (Finding 2)", async () => {
    vi.mocked(getPiketComplianceAction).mockResolvedValueOnce({
      success: true,
      data: [
        {
          profileId: "p-9",
          memberName: "Lama Alpha",
          nim: "9",
          academicPeriod: "2025/2026",
          weekNumber: 2,
          roomTarget: "Workshop",
          startIsoDate: "2025-07-07",
          endIsoDate: "2025-07-13",
          cycleMonthLabel: "Juli 2025",
          status: "alpha",
        },
      ],
    });

    render(
      <PiketVerificationClient
        {...baseProps}
        availablePeriods={["2026/2027", "2025/2026"]}
        compliance={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kepatuhan/i }));

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "2025/2026" },
    });

    await waitFor(() => {
      expect(getPiketComplianceAction).toHaveBeenCalledWith("2025/2026");
    });
    await waitFor(() => {
      expect(screen.getByText("Lama Alpha")).toBeTruthy();
    });
  });

  it("menampilkan pesan error bila pemuatan kepatuhan gagal (Finding 3)", async () => {
    vi.mocked(getPiketComplianceAction).mockResolvedValueOnce({
      success: false,
      error: "Gagal memuat laporan kepatuhan: boom",
    });

    render(
      <PiketVerificationClient
        {...baseProps}
        availablePeriods={["2026/2027", "2025/2026"]}
        compliance={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kepatuhan/i }));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "2025/2026" },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Gagal memuat laporan kepatuhan\. Coba muat ulang\./),
      ).toBeTruthy();
    });
  });
});
