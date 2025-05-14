import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { authorize } from '@/lib/middleware/authorize';

export async function POST(req: NextRequest) {
  // Only allow admins to access this route
  const authResult = await authorize(req);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authorized
  }

  try {
    const { userId, email } = await req.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }
    
    // Get current user data to check if email has actually changed
    const userRecord = await auth.getUser(userId);
    
    if (userRecord.email === email) {
      // Email hasn't changed, just return success
      return NextResponse.json({
        success: true,
        message: 'No change to email address'
      }, { status: 200 });
    }
    
    // Check if the new email is already in use by another user
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser && existingUser.uid !== userId) {
        return NextResponse.json({ 
          error: 'Email is already in use by another account' 
        }, { status: 409 });
      }
    } catch (error: any) {
      // Error auth/user-not-found is expected if email isn't in use
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
    // Update the user's email in Firebase Auth
    await auth.updateUser(userId, { email });
    
    // Also update in Firestore
    await db.collection('users').doc(userId).update({ email });

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating email:', error);
    
    // Return appropriate error based on Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } else if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    } else if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ 
        error: 'Email is already in use by another account' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Error updating email' 
    }, { status: 500 });
  }
} 