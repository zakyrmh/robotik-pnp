// app/api/validate-scan/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import * as admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

// ----- Types -----
interface Attendance {
  userId: string;
  activityId: string;
  timestamp: string; // ISO
  status: "present" | "absent";
  verifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ----- Firebase Admin Init -----
function initFirebaseAdmin(): void {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? "";
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "";
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

initFirebaseAdmin();
const db: admin.firestore.Firestore = admin.firestore();

// ----- API Handler -----
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      userId: string;
      activityId: string;
      timestamp: string;
      signature: string;
    };

    const { userId, activityId, timestamp, signature } = body;

    if (!userId || !activityId || !timestamp || !signature) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const secret = process.env.SIGNING_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Signing secret not configured" }, { status: 500 });
    }

    // verify HMAC
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${userId}|${activityId}|${timestamp}`);
    const expected = hmac.digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // check timestamp validity
    const qrValidity = parseInt(process.env.QR_VALIDITY_SECONDS ?? "300", 10);
    const ts = new Date(timestamp);
    const now = new Date();
    const diffSeconds = (now.getTime() - ts.getTime()) / 1000;
    if (diffSeconds < 0 || diffSeconds > qrValidity) {
      return NextResponse.json({ error: "QR expired" }, { status: 400 });
    }

    // search existing attendance doc
    const attendanceQuery = await db
      .collection("attendance")
      .where("userId", "==", userId)
      .where("activityId", "==", activityId)
      .limit(1)
      .get();

    if (!attendanceQuery.empty) {
      const docSnap = attendanceQuery.docs[0];
      const data = docSnap.data() as Attendance;

      if (data.status === "present") {
        return NextResponse.json({ ok: true, message: "already_present" }, { status: 200 });
      }

      const updateData: Partial<Attendance> = {
        status: "present",
        updatedAt: new Date().toISOString(),
        verifiedBy: "admin-scan-api",
      };

      await docSnap.ref.update(updateData);

      return NextResponse.json({ ok: true, message: "updated_to_present" }, { status: 200 });
    }

    // otherwise create
    const newAttendance: Attendance = {
      userId,
      activityId,
      timestamp: new Date().toISOString(),
      status: "present",
      verifiedBy: "admin-scan-api",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("attendance").doc().set(newAttendance);

    return NextResponse.json({ ok: true, message: "created" }, { status: 201 });
  } catch (err) {
    console.error("validate-scan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
