// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

let app: admin.app.App | undefined;

/**
 * Inisialisasi Firebase Admin sekali saja
 * (biar gak error "App already exists" di Next.js hot reload)
 */
export function initAdmin() {
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    app = admin.app();
  }

  return app;
}

export const adminAuth = () => admin.auth();
export const adminDb = () => admin.firestore();
