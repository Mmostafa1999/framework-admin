import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { authorize } from '@/lib/middleware/authorize';

export async function DELETE(req: NextRequest) {
  // Only allow admins to access this route
  const authResult = await authorize(req);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authorized
  }

  // Extract userId from the URL or body
  const url = new URL(req.url);
  let userId = url.searchParams.get('userId');
  
  // If userId is not in query params, try to get it from the request body
  if (!userId) {
    try {
      const body = await req.json();
      userId = body.userId;
    } catch (_) {
      // If there's no body, continue with null userId
    }
  }

  // Validate user ID
  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
  }

  try {
    // Delete from Firestore first
    await db.collection('users').doc(userId).delete();
    
    // Then delete from Firebase Auth
    await auth.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    // Return appropriate error based on Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Error deleting user',
      message: error.message
    }, { status: 500 });
  }
} 