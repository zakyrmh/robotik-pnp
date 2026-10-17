import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AnggotaQrView } from "./anggota-qr-view";
import { generateAttendanceQR } from "@/lib/actions/attendance";

vi.mock("@/lib/actions/attendance", () => ({
  generateAttendanceQR: vi.fn(),
  submitLeaveRequest: vi.fn(),
}));
vi.mock("@/lib/utils/crypto", () => ({
  encryptToken: () => {
    throw new Error("QR encryption must run on the server");
  },
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    const query = {
      from: () => query,
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: null }),
    };
    return query;
  },
}));
vi.mock("@hugeicons/react", () => ({ HugeiconsIcon: () => null }));

const props = {
  activityId: "550e8400-e29b-41d4-a716-446655440001",
  activityTitle: "Kegiatan Caang",
  profileId: "550e8400-e29b-41d4-a716-446655440000",
  profileName: "Peserta",
  nim: "12345678",
};
const generatedQR = (token: string) => ({
  success: true,
  message: "Berhasil",
  data: {
    qrString: token,
    expiresAt: new Date(Date.now() + 300000).toISOString(),
  },
});

describe("AnggotaQrView server-issued QR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders the server token and obtains a new server token on refresh", async () => {
    vi.mocked(generateAttendanceQR)
      .mockResolvedValueOnce(generatedQR("server-token-one"))
      .mockResolvedValueOnce(generatedQR("server-token-two"));
    render(<AnggotaQrView {...props} />);
    await waitFor(() =>
      expect(generateAttendanceQR).toHaveBeenCalledWith(props.activityId),
    );
    await waitFor(() =>
      expect(
        screen.getByAltText("Dynamic QR Code").getAttribute("src"),
      ).toContain("server-token-one"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /REFRESH QR CODE SEKARANG/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByAltText("Dynamic QR Code").getAttribute("src"),
      ).toContain("server-token-two"),
    );
    expect(generateAttendanceQR).toHaveBeenCalledTimes(2);
  });

  it("shows a recoverable server error instead of a locally encrypted QR", async () => {
    vi.mocked(generateAttendanceQR)
      .mockResolvedValueOnce({
        success: false,
        message: "Sesi tidak ditemukan.",
      })
      .mockResolvedValueOnce(generatedQR("retry-token"));
    render(<AnggotaQrView {...props} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sesi tidak ditemukan.",
    );
    expect(screen.queryByAltText("Dynamic QR Code")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /REFRESH QR CODE SEKARANG/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByAltText("Dynamic QR Code").getAttribute("src"),
      ).toContain("retry-token"),
    );
  });

  it("automatically requests a fresh server token at the server expiry time", async () => {
    vi.useFakeTimers();
    vi.mocked(generateAttendanceQR)
      .mockResolvedValueOnce({
        ...generatedQR("short-token"),
        data: {
          qrString: "short-token",
          expiresAt: new Date(Date.now() + 1000).toISOString(),
        },
      })
      .mockResolvedValueOnce(generatedQR("renewed-token"));
    await act(async () => {
      render(<AnggotaQrView {...props} />);
    });
    expect(
      screen.getByAltText("Dynamic QR Code").getAttribute("src"),
    ).toContain("short-token");
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(generateAttendanceQR).toHaveBeenCalledTimes(2);
    expect(
      screen.getByAltText("Dynamic QR Code").getAttribute("src"),
    ).toContain("renewed-token");
  });

  it("does not request a QR outside the configured check-in window", async () => {
    render(
      <AnggotaQrView
        {...props}
        checkinOpenAt={new Date(Date.now() + 3600000).toISOString()}
        checkinCloseAt={new Date(Date.now() + 7200000).toISOString()}
      />,
    );
    await waitFor(() =>
      expect(screen.queryByText("MEMERIKSA STATUS...")).not.toBeInTheDocument(),
    );
    expect(generateAttendanceQR).not.toHaveBeenCalled();
  });
});
