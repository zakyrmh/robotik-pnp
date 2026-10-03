import { describe, it, expect } from "vitest";
import { buildCommunityWaUrl, MRC_COMMUNITY_WA_TEMPLATE } from "./event-wa";

const GROUP_URL = "https://chat.whatsapp.com/L247nXGrBGnHLDd2FcDyPi";

describe("buildCommunityWaUrl", () => {
  it("membangun tautan wa.me ke nomor tim dengan pesan undangan terisi", () => {
    const url = buildCommunityWaUrl({
      teamWhatsapp: "081234567890",
      groupUrl: GROUP_URL,
    });

    expect(url).not.toBeNull();
    expect(url!.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
  });

  it("menyertakan link grup komunitas di dalam pesan", () => {
    const url = buildCommunityWaUrl({
      teamWhatsapp: "081234567890",
      groupUrl: GROUP_URL,
    });
    const decoded = decodeURIComponent(url!.split("?text=")[1]);
    expect(decoded).toContain(GROUP_URL);
  });

  it("memuat kalimat kunci undangan komunitas (persis teks panitia)", () => {
    const url = buildCommunityWaUrl({
      teamWhatsapp: "081234567890",
      groupUrl: GROUP_URL,
    });
    const decoded = decodeURIComponent(url!.split("?text=")[1]);
    expect(decoded).toContain(
      "Halo Tim Peserta *Minangkabau Robot Contest 2026*! 👋",
    );
    expect(decoded).toContain("*Panitia MRC 2026*");
    expect(decoded).toContain("Salam Inovasi");
  });

  it("menormalkan nomor telepon: 0 -> 62, buang non-digit", () => {
    const url = buildCommunityWaUrl({
      teamWhatsapp: "0812-3456-7890",
      groupUrl: GROUP_URL,
    });
    expect(url!.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
  });

  it("membiarkan nomor yang sudah berawalan 62", () => {
    const url = buildCommunityWaUrl({
      teamWhatsapp: "6281234567890",
      groupUrl: GROUP_URL,
    });
    expect(url!.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
  });

  it("mengembalikan null bila link grup kosong (agar tombol bisa dinonaktifkan)", () => {
    expect(
      buildCommunityWaUrl({ teamWhatsapp: "081234567890", groupUrl: null }),
    ).toBeNull();
    expect(
      buildCommunityWaUrl({ teamWhatsapp: "081234567890", groupUrl: "   " }),
    ).toBeNull();
  });

  it("mengembalikan null bila nomor tim kosong", () => {
    expect(
      buildCommunityWaUrl({ teamWhatsapp: "", groupUrl: GROUP_URL }),
    ).toBeNull();
  });

  it("template berisi placeholder {{groupUrl}}", () => {
    expect(MRC_COMMUNITY_WA_TEMPLATE).toContain("{{groupUrl}}");
  });
});
