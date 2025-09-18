// app/api/sign-qr/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, activityId } = body;

    if (!userId || !activityId) {
      return NextResponse.json({ error: "userId and activityId required" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const secret = process.env.SIGNING_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Signing secret not configured" }, { status: 500 });
    }

    // signature = HMAC-SHA256(userId|activityId|timestamp, secret)
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${userId}|${activityId}|${timestamp}`);
    const signature = hmac.digest("hex");

    const payload = { userId, activityId, timestamp, signature };

    return NextResponse.json({ payload }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
