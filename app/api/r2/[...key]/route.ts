import { NextRequest, NextResponse } from "next/server";
import { getObjectFromR2 } from "@/lib/storage/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    if (!key || key.length === 0) {
      return new NextResponse("Key not specified", { status: 400 });
    }

    const objectKey = key.join("/");
    const { body, contentType } = await getObjectFromR2(objectKey);

    if (!body) {
      return new NextResponse("Object body empty", { status: 404 });
    }

    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": contentType || "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Error fetching object from R2";
    console.error("Gagal mengambil objek dari R2 via API Proxy:", errMsg);
    return new NextResponse(errMsg, { status: 404 });
  }
}
