import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { authorize } from '@/lib/middleware/authorize';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  
  // Only allow admins to access this route
  const authResult = await authorize(req);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authorized
  }
  

  try {
    const requestData = await req.json();
    
    
    const { 
      email, 
      password, 
      name, 
      role, 
      organizationId, 
      assignedProjectIds = [],
      status = 'Active',
      locale 
    } = requestData;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      disabled: status !== 'Active',
    });

    // Set custom claims for role-based access
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      organizationId,
    });

    // Create the user document in Firestore
    const userData = {
      name,
      email,
      role,
      status,
      organizationId,
      assignedProjectIds,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: null,
      locale,
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    // Return appropriate error based on Firebase auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    } else if (error.code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    } else if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Error creating user', 
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 