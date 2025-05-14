import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { authorize } from '@/lib/middleware/authorize';

export async function POST(req: NextRequest) {
  // Only allow admins to access this route
  const authResult = await authorize(req);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authorized
  }

  try {
    const { userId, password } = await req.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Missing password' }, { status: 400 });
    }

    // Ensure password meets Firebase requirements (min 6 chars)
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters' 
      }, { status: 400 });
    }
    
    // Update the user's password in Firebase Auth
    await auth.updateUser(userId, { password });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating password:', error);
    
    // Return appropriate error based on Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } else if (error.code === 'auth/invalid-password') {
      return NextResponse.json({ 
        error: 'Invalid password format' 
      }, { status: 400 });
    } else if (error.code === 'auth/weak-password') {
      return NextResponse.json({ 
        error: 'Password is too weak' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Error updating password' 
    }, { status: 500 });
  }
} 