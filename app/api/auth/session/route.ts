import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin"; // pastikan ini menginisialisasi admin

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Buat session cookie yang berlaku 5 hari
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    // Buat response dan set cookie HttpOnly
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Error creating session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create session" });
}
