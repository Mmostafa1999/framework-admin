import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { authorize } from '@/lib/middleware/authorize';
import { canManageUser } from '@/lib/middleware/authorize';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Extract userId outside of any try blocks
  const { userId } = params;
  console.log(`Fetching user data for userId: ${userId}`);
  
  try {    
    // First try to get the session directly rather than using authorize middleware
    // This avoids potential circular dependencies during login
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      console.log('No session cookie found when fetching user data');
      return NextResponse.json({ error: 'Unauthorized - No session cookie' }, { status: 401 });
    }

    try {
      // Verify the session cookie
      const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
      const currentUserId = decodedToken.uid;
      console.log(`Session verified for user: ${currentUserId}`);
      
      // Check if the user is requesting their own profile or is an admin
      const userRecord = await auth.getUser(currentUserId);
      const userRole = userRecord.customClaims?.role || 'User';
      
      // Allow users to access their own data or admins to access any user's data
      if (currentUserId !== userId && userRole !== 'Admin') {
        console.log(`Permission denied: ${currentUserId} attempting to access ${userId} with role ${userRole}`);
        return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
      }
      
      // Get the user document from Firestore
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
          console.log(`User not found in Firestore: ${userId}`);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();
        if (!userData) {
          console.log(`User data is empty for: ${userId}`);
          return NextResponse.json({ error: 'User data is empty' }, { status: 404 });
        }

        // Format the user data
        const user = {
          id: userDoc.id,
          ...userData,
          // Convert timestamps to ISO strings for JSON serialization
          createdAt: userData?.createdAt ? userData.createdAt.toDate().toISOString() : null,
          lastLogin: userData?.lastLogin ? userData.lastLogin.toDate().toISOString() : null,
        };
        
        console.log(`Successfully retrieved user data for: ${userId}`);
        return NextResponse.json({ user }, { status: 200 });
      } catch (firestoreError: any) {
        console.error('Firestore connection error:', firestoreError);
        return NextResponse.json({ 
          error: 'Database connection error', 
          details: firestoreError.message || 'Failed to connect to the database'
        }, { status: 503 });
      }
    
    } catch (sessionError: any) {
      console.error('Session verification error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error getting user:', error);
    const errorMessage = error.message || 'Error getting user';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 