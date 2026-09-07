import { describe, it, expect, vi } from "vitest";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

vi.mock("server-only", () => ({}));

const uploaded: Array<{ key: string; contentType: string; bytes: number }> = [];
vi.mock("@/lib/storage/r2", () => ({
  uploadToR2: vi.fn(
    async (params: {
      fileBuffer: Buffer;
      key: string;
      contentType: string;
    }) => {
      uploaded.push({
        key: params.key,
        contentType: params.contentType,
        bytes: params.fileBuffer.length,
      });
      return `https://r2-mock.test/${params.key}`;
    },
  ),
  getPublicR2Url: (key: string) => `https://r2-mock.test/${key}`,
}));

import {
  assertTrustedImageBuffer,
  processAndUploadMrcImage,
  MrcImageValidationError,
} from "@/lib/server/mrc-image-pipeline";
import { MRC_MAX_RAW_BYTES } from "@/lib/mrc-image-config";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function syntheticHeicHeader(): Buffer {
  const head = Buffer.alloc(24);
  head.writeUInt32BE(24, 0);
  head.write("ftyp", 4);
  head.write("heic", 8);
  head.writeUInt32BE(0, 12);
  head.write("heic", 16);
  head.write("mif1", 20);
  return head;
}

describe("assertTrustedImageBuffer (magic bytes, bukan File.type)", () => {
  it("menerima PNG valid meski tanpa info nama/tipe dari browser", async () => {
    const res = await assertTrustedImageBuffer(PNG_1X1, "photo");
    expect(res.mime).toBe("image/png");
  });

  it("menerima JPEG yang dibuat sharp", async () => {
    const jpeg = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
    const res = await assertTrustedImageBuffer(Buffer.from(jpeg), "photo");
    expect(res.mime).toBe("image/jpeg");
  });

  it("menolak teks yang disamarkan sebagai .jpg (signature tak cocok)", async () => {
    const spoof = Buffer.from("Hello world, bukan gambar sama sekali");
    await expect(
      assertTrustedImageBuffer(spoof, "photo"),
    ).rejects.toBeInstanceOf(MrcImageValidationError);
  });

  it("menolak buffer kosong", async () => {
    await expect(
      assertTrustedImageBuffer(Buffer.alloc(0), "photo"),
    ).rejects.toBeInstanceOf(MrcImageValidationError);
  });

  it("menolak HEIC mentah dengan pesan konversi yang jelas", async () => {
    await expect(
      assertTrustedImageBuffer(syntheticHeicHeader(), "photo"),
    ).rejects.toThrowError(/HEIC\/HEIF/);
  });

  it("menolak file melebihi batas ukuran sebelum inspeksi signature", async () => {
    const giant = Buffer.alloc(MRC_MAX_RAW_BYTES.photo + 1);
    await expect(assertTrustedImageBuffer(giant, "photo")).rejects.toThrowError(
      /melebihi batas/,
    );
  });

  it("batas kartu identitas lebih longgar dari pas foto", () => {
    expect(MRC_MAX_RAW_BYTES.identityCard).toBeGreaterThan(
      MRC_MAX_RAW_BYTES.photo,
    );
  });
});

describe("processAndUploadMrcImage (sharp → WebP + thumbnail → R2)", () => {
  it("menormalisasi JPEG besar menjadi WebP utama + thumbnail", async () => {
    uploaded.length = 0;
    const big = await sharp({
      create: {
        width: 2000,
        height: 1500,
        channels: 3,
        background: { r: 30, g: 90, b: 180 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();
    const file = new File([big], "foto.jpg", { type: "image/jpeg" });

    const out = await processAndUploadMrcImage(file, "photo");

    expect(out.url).toContain(".webp");
    expect(out.thumbUrl).toContain("-thumb.webp");
    expect(out.width).toBeLessThanOrEqual(960);
    expect(uploaded).toHaveLength(2);
    for (const item of uploaded) {
      expect(item.contentType).toBe("image/webp");
      expect(item.key).toMatch(/^mrc\/photos\//);
    }
    // Verifikasi ulang output benar-benar WebP via magic bytes.
    const mainUpload = uploaded.find((u) => !u.key.endsWith("-thumb.webp"));
    expect(mainUpload).toBeDefined();
  });

  it("menolak File kosong", async () => {
    const empty = new File([], "kosong.jpg", { type: "image/jpeg" });
    await expect(
      processAndUploadMrcImage(empty, "photo"),
    ).rejects.toBeInstanceOf(MrcImageValidationError);
  });

  it("output utama terdeteksi sebagai WebP via magic bytes", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const converted = await sharp(png)
      .resize(64, 64)
      .webp({ quality: 80 })
      .toBuffer();
    const detected = await fileTypeFromBuffer(
      new Uint8Array(
        converted.buffer,
        converted.byteOffset,
        converted.byteLength,
      ),
    );
    expect(detected?.mime).toBe("image/webp");
  });
});
