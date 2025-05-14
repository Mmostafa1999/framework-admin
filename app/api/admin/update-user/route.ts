import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { authorize } from '@/lib/middleware/authorize';

// Add POST handler that redirects to the PATCH handler
export async function POST(req: NextRequest) {
  // Simply call the PATCH handler to handle POST requests the same way
  return PATCH(req);
}

export async function PATCH(req: NextRequest) {
  // Only allow admins to access this route
  const authResult = await authorize(req);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authorized
  }

  try {
    const { 
      userId,
      name, 
      role, 
      status,
      organizationId, 
      assignedProjectIds,
      password, // Optional, only update if provided
      locale,
      email
    } = await req.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Get the current user to avoid unnecessary updates
    const userRecord = await auth.getUser(userId);
    
    // Prepare Firebase Auth update data
    const authUpdateData: any = {};
    
    if (name && name !== userRecord.displayName) {
      authUpdateData.displayName = name;
    }
    
    if (status !== undefined) {
      authUpdateData.disabled = status !== 'Active';
    }
    
    // Handle email update
    if (email && email !== userRecord.email) {
      authUpdateData.email = email;
    }
    
    if (password) {
      authUpdateData.password = password;
    }
    
    // Update Firebase Auth user if we have changes
    if (Object.keys(authUpdateData).length > 0) {
      await auth.updateUser(userId, authUpdateData);
    }
    
    // Update custom claims if role or organization has changed
    const currentClaims = userRecord.customClaims || {};
    if (role !== currentClaims.role || organizationId !== currentClaims.organizationId) {
      await auth.setCustomUserClaims(userId, {
        ...currentClaims,
        role: role || currentClaims.role,
        organizationId: organizationId || currentClaims.organizationId,
      });
    }

    // Prepare Firestore update data (only including fields that are provided)
    const firestoreUpdateData: any = {};
    
    if (name !== undefined) firestoreUpdateData.name = name;
    if (email !== undefined) firestoreUpdateData.email = email;
    if (role !== undefined) firestoreUpdateData.role = role;
    if (status !== undefined) firestoreUpdateData.status = status;
    if (organizationId !== undefined) firestoreUpdateData.organizationId = organizationId;
    if (assignedProjectIds !== undefined) firestoreUpdateData.assignedProjectIds = assignedProjectIds;
    if (locale !== undefined) firestoreUpdateData.locale = locale;

    // Update Firestore document if we have changes
    if (Object.keys(firestoreUpdateData).length > 0) {
      await db.collection('users').doc(userId).update(firestoreUpdateData);
    }

    return NextResponse.json({
      success: true,
      userId,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    // Return appropriate error based on Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } else if (error.code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
} 