import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../firebase-admin';
import { cookies } from 'next/headers';

/**
 * Middleware to protect API routes by checking if the user is authenticated and has the admin role
 * @param handler The API route handler
 * @param roles Array of authorized roles (defaults to ['Admin'])
 */
export async function authorize(
  req: NextRequest,
  roles: string[] = ['Admin']
): Promise<{ userId: string; role: string } | NextResponse> {
  try {
    // Get the session cookie from the request
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized - No session cookie' }, { status: 401 });
    }

    // Verify the session cookie and get the user's token
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // Get the user's custom claims to check their role
    const userRecord = await auth.getUser(userId);
    const userRole = userRecord.customClaims?.role || 'User';

    // Check if the user has an authorized role
    if (!roles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    // Return the user ID and role if authorized
    return { userId, role: userRole };
  } catch (error) {
    console.error('Authorization error:', error);
    return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
  }
}

/**
 * Middleware to check if a user has permission to manage another user
 * Admins can manage any user, but other roles can only manage themselves
 */
export async function canManageUser(
  userId: string,
  targetUserId: string,
  userRole: string
): Promise<boolean> {
  // Admins can manage any user
  if (userRole === 'Admin') {
    return true;
  }
  
  // Other roles can only manage themselves
  return userId === targetUserId;
} 