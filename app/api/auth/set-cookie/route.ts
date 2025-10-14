// ✅ LEBIH AMAN: Set cookie via API route
// File: app/api/auth/set-cookie/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token, remember } = await request.json();
  
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('authToken', token, {
    httpOnly: true,      // 🔐 Cookie tidak bisa diakses JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: remember ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
    path: '/',
  });
  
  return response;
}