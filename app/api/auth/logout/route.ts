import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Hapus session cookie
    cookieStore.delete('session')

    // Redirect ke halaman login    
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}