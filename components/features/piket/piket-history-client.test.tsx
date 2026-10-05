import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PiketHistoryClient } from "./piket-history-client";
import type {
  PiketComplianceRow,
  PiketHistoryLog,
  PiketMemberHistoryEntry,
} from "@/lib/repositories/piket";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: vi.fn() }),
  usePathname: () => "/piket/riwayat",
  useSearchParams: () => new URLSearchParams("tab=kepatuhan"),
}));

const getPiketMemberHistoryActionMock = vi.fn();
vi.mock("@/lib/actions/piket", () => ({
  getPiketMemberHistoryAction: (profileId: string) =>
    getPiketMemberHistoryActionMock(profileId),
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
  {
    id: "log-2",
    scheduleId: "sch-2",
    academicPeriod: "2026/2027",
    weekNumber: 2,
    roomTarget: "Workshop",
    dutyDate: "2026-07-07",
    reportedById: "p-4",
    reporterName: "Dewi Pending",
    reporterNim: "210109004",
    status: "pending",
    rejectionReason: "",
    verifiedAt: "",
    verifierName: "",
    notes: "",
    proofImageUrl: "",
    proofImageBeforeUrl: "",
    createdAt: "2026-07-07T00:00:00.000Z",
  },
];

/** Fixture kaya: 2 anggota beda nama & status untuk uji filter klien. */
const complianceMultiFixture: PiketComplianceRow[] = [
  ...complianceFixture,
  {
    profileId: "p-5",
    memberName: "Andi Berlangsung",
    nim: "210109005",
    academicPeriod: "2026/2027",
    weekNumber: 2,
    roomTarget: "Workshop",
    startIsoDate: "2026-07-06",
    endIsoDate: "2026-07-12",
    cycleMonthLabel: "Juli 2026",
    status: "berlangsung",
  },
];

const memberHistoryFixture: PiketMemberHistoryEntry[] = [
  {
    id: "hist-1",
    scheduleId: "sch-1",
    academicPeriod: "2026/2027",
    weekNumber: 1,
    roomTarget: "Workshop",
    dutyDate: "2026-06-30",
    status: "approved",
    rejectionReason: "",
    verifierName: "Kestari Satu",
    notes: "Ruangan sudah bersih",
    proofImageUrl: "proofs/after.jpg",
    proofImageBeforeUrl: "proofs/before.jpg",
    createdAt: "2026-06-30T00:00:00.000Z",
  },
];

describe("PiketHistoryClient", () => {
  beforeEach(() => {
    getPiketMemberHistoryActionMock.mockReset();
    getPiketMemberHistoryActionMock.mockResolvedValue({
      success: true,
      message: "OK",
      data: memberHistoryFixture,
    });
  });

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

  it("klik baris Kepatuhan membuka drawer dan memanggil action dengan profileId", async () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.click(screen.getByText("Budi Alpha"));

    await waitFor(() => {
      expect(getPiketMemberHistoryActionMock).toHaveBeenCalledWith("p-2");
    });

    // Hasil action dirender: status badge + catatan
    await waitFor(() => {
      expect(screen.getByText("Ruangan sudah bersih")).toBeTruthy();
    });
    expect(screen.getAllByText("TERVERIFIKASI").length).toBeGreaterThan(0);
  });

  it("klik baris Log membuka drawer dan memanggil action dengan profileId", async () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="log"
      />,
    );

    fireEvent.click(screen.getByText("Citra Petugas"));

    await waitFor(() => {
      expect(getPiketMemberHistoryActionMock).toHaveBeenCalledWith("p-3");
    });
    await waitFor(() => {
      expect(screen.getByText("Ruangan sudah bersih")).toBeTruthy();
    });
  });

  it("tab Log menampilkan kolom Bukti, Catatan, dan Verifikator", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="log"
      />,
    );
    expect(screen.getByText("Bukti")).toBeTruthy();
    expect(screen.getByText("Catatan")).toBeTruthy();
    expect(screen.getByText("Verifikator")).toBeTruthy();
    expect(screen.getByText("Kestari Satu")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /Lihat/i }).length,
    ).toBeGreaterThan(0);
  });

  it("drawer tidak memanggil action saat tertutup", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    expect(getPiketMemberHistoryActionMock).not.toHaveBeenCalled();
  });

  it("drawer menampilkan empty state saat action sukses tanpa data", async () => {
    getPiketMemberHistoryActionMock.mockResolvedValueOnce({
      success: true,
      message: "OK",
      data: [],
    });

    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.click(screen.getByText("Budi Alpha"));

    await waitFor(() => {
      expect(screen.getByTestId("piket-member-drawer-empty")).toBeTruthy();
    });
    expect(screen.getByText("Belum ada riwayat piket")).toBeTruthy();
  });

  it("drawer menampilkan error state saat action gagal", async () => {
    getPiketMemberHistoryActionMock.mockResolvedValueOnce({
      success: false,
      message: "Akses ditolak.",
    });

    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.click(screen.getByText("Budi Alpha"));

    await waitFor(() => {
      expect(screen.getByTestId("piket-member-drawer-error")).toBeTruthy();
    });
    expect(screen.getByText("Akses ditolak.")).toBeTruthy();
  });

  it("mencari nama anggota menyaring baris Kepatuhan", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceMultiFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    expect(screen.getByText("Budi Alpha")).toBeTruthy();
    expect(screen.getByText("Andi Berlangsung")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Cari nama anggota"), {
      target: { value: "andi" },
    });

    expect(screen.getByText("Andi Berlangsung")).toBeTruthy();
    expect(screen.queryByText("Budi Alpha")).toBeNull();
  });

  it("memilih status menyaring baris Kepatuhan", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceMultiFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "alpha" },
    });

    expect(screen.getByText("Budi Alpha")).toBeTruthy();
    expect(screen.queryByText("Andi Berlangsung")).toBeNull();
  });

  it("mencari nama petugas menyaring baris Log", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="log"
      />,
    );

    expect(screen.getByText("Citra Petugas")).toBeTruthy();
    expect(screen.getByText("Dewi Pending")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Cari nama anggota"), {
      target: { value: "dewi" },
    });

    expect(screen.getByText("Dewi Pending")).toBeTruthy();
    expect(screen.queryByText("Citra Petugas")).toBeNull();
  });

  it("memilih status menyaring baris Log", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="log"
      />,
    );

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "pending" },
    });

    expect(screen.getByText("Dewi Pending")).toBeTruthy();
    expect(screen.queryByText("Citra Petugas")).toBeNull();
  });

  it("empty state membedakan hasil filter kosong dari data kosong", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceMultiFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.change(screen.getByLabelText("Cari nama anggota"), {
      target: { value: "tidak-ada-nama" },
    });

    expect(
      screen.getByText("Tidak ada hasil kepatuhan untuk filter yang dipilih."),
    ).toBeTruthy();
    expect(
      screen.queryByText(/Belum ada data kepatuhan untuk periode/i),
    ).toBeNull();
  });

  it("perpindahan tab Log memperbarui query dengan tab=log", () => {
    replaceMock.mockClear();
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={logFixture}
        initialTab="kepatuhan"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Log$/i }));

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const [url] = replaceMock.mock.calls[0] as [string];
    expect(url).toContain("tab=log");
  });

  it("menampilkan panel error + tombol muat ulang di tab Kepatuhan saat loadError", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={[]}
        logs={logFixture}
        initialTab="kepatuhan"
        loadError="Gagal memuat rekap kepatuhan piket. Coba muat ulang halaman ini."
      />,
    );

    expect(
      screen.getAllByText(/Gagal memuat rekap kepatuhan piket/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Muat ulang/i }).length,
    ).toBeGreaterThan(0);
    // Empty state palsu tidak ditampilkan saat error.
    expect(
      screen.queryByText(/Belum ada data kepatuhan untuk periode/i),
    ).toBeNull();
  });

  it("menampilkan panel error + tombol muat ulang di tab Log saat loadError", () => {
    render(
      <PiketHistoryClient
        {...baseProps}
        compliance={complianceFixture}
        logs={[]}
        initialTab="log"
        loadError="Gagal memuat log laporan piket. Coba muat ulang halaman ini."
      />,
    );

    expect(
      screen.getAllByText(/Gagal memuat log laporan piket/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Muat ulang/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/Belum ada log piket untuk periode/i)).toBeNull();
  });
});
