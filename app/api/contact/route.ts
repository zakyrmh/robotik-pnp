import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap harus diisi"),
  organization: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid"),
  category: z.string().min(1, "Kategori harus dipilih"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
  website: z.string().optional().nullable(), // Honeypot field
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    // 1. Honeypot check: If the honeypot field is filled, we silently ignore
    // the request and return a success response to deceive the bot.
    if (validated.website) {
      console.warn("Honeypot triggered! Bot detected.", {
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "127.0.0.1",
        data: validated,
      });
      return NextResponse.json({
        success: true,
        message: "Pesan Anda telah berhasil dikirim!",
      });
    }

    // 2. Insert contact message to database
    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      full_name: validated.fullName,
      organization: validated.organization || null,
      email: validated.email,
      category: validated.category,
      message: validated.message,
    });

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json(
        { success: false, error: "Gagal menyimpan pesan ke database." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pesan Anda telah berhasil dikirim!",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("System error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan sistem." },
      { status: 500 },
    );
  }
}
