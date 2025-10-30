import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value
    
    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }
    
    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    
    return NextResponse.json({
      authenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
      },
    })
  } catch (error) {
    console.error('Error verifying session:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}