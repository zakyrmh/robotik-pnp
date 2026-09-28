import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PiketVerificationClient } from "./piket-verification-client";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/piket", () => ({
  reviewPiketLog: vi.fn(),
  imposePiketFine: vi.fn(),
  markPiketFinePaid: vi.fn(),
  voidPiketFine: vi.fn(),
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
            status: "alpha",
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kepatuhan/i }));
    expect(screen.getByText("Budi Alpha")).toBeTruthy();
    expect(screen.getByText("ALPHA")).toBeTruthy();
  });
});
