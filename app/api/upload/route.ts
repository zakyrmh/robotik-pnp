// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const newFileName = (data.get("newFileName") as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.error("Missing Google credentials in env");
      return NextResponse.json({ success: false, message: "Server config error" }, { status: 500 });
    }

    // inisialisasi OAuth2 client dengan refresh token (server-side)
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    // Convert File -> stream
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(fileBuffer);

    const parents = process.env.GOOGLE_FOLDER_ID ? [process.env.GOOGLE_FOLDER_ID] : undefined;

    // Create file
    const createRes = await drive.files.create({
      requestBody: {
        name: newFileName || file.name,
        parents,
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: fileStream,
      },
      fields: "id, name",
    });

    const fileId = createRes.data.id;
    if (!fileId) {
      throw new Error("Upload sukses tapi fileId tidak dikembalikan.");
    }

    // Buat permission supaya bisa diakses via web (opsional — jika kamu ingin publik)
    // HATI-HATI: ini membuat file dapat diakses siapa saja yang punya link.
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (permErr) {
      // jika permission gagal, kita tetap lanjut untuk ambil link (kadang permission tidak diperlukan)
      console.warn("Gagal set permission publik:", permErr);
    }

    // Ambil metadata lengkap (webViewLink/webContentLink)
    const meta = await drive.files.get({
      fileId,
      fields: "id, name, webViewLink, webContentLink",
    });

    // Pilih URL yang paling useful
    const webViewLink = meta.data.webViewLink ?? null;
    const webContentLink = meta.data.webContentLink ?? null;

    // Fallback: link universal ke file berdasarkan id
    const fallbackUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    // Prioritas: webViewLink > webContentLink > fallback
    const fileUrl = webViewLink || webContentLink || fallbackUrl;

    return NextResponse.json({
      success: true,
      message: "File berhasil diunggah!",
      fileId,
      fileUrl,
      fileData: meta.data,
    });
  } catch (error: unknown) {
    let errorMessage = "Gagal mengunggah file.";
    if (error instanceof Error) errorMessage = error.message;
    console.error("Error saat mengunggah ke Google Drive:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengunggah file.", error: errorMessage },
      { status: 500 }
    );
  }
}
