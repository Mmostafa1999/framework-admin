import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

// Session expiration time (2 weeks)
const SESSION_EXPIRATION = 60 * 60 * 24 * 14 * 1000;

/**
 * Create a new session cookie from an ID token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken } = body;
    
    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
    }

    // Create a session cookie from the ID token
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRATION,
    });

    // Set the cookie in the response
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: SESSION_EXPIRATION / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Session creation error:', error);
    
    // Return more specific error messages to help with debugging
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Invalid ID token', 
        message: error.message 
      }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
  }
}

/**
 * Verify the session cookie and return user claims
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Get the user record to include the latest custom claims
    const userRecord = await auth.getUser(decodedClaims.uid);
    
    return NextResponse.json({
      authenticated: true,
      uid: decodedClaims.uid,
      role: userRecord.customClaims?.role || 'User',
      email: userRecord.email,
      displayName: userRecord.displayName,
    }, { status: 200 });
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Session verification error:', error);
    
    // Clear the invalid session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    // Return more details in development environment
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      }, { status: 200 });
    }
    
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

/**
 * Delete the session cookie (sign out)
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ success: true }, { status: 200 });
} 