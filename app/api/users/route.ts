import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { authorize } from '@/lib/middleware/authorize';
import { Query } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  // Authorize the request (Admin, Consultant, Client allowed)
  const authResult = await authorize(req, ['Admin', 'Consultant', 'Client']);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authorized
  }

  try {
    // Extract query parameters
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const organization = url.searchParams.get('organization');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Start with the base users collection
    let query: Query = db.collection('users');
    
    // Apply filters if provided
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (organization) {
      query = query.where('organizationId', '==', organization);
    }
    
    // For non-admin users, filter by their organization
    if (authResult.role !== 'Admin') {
      // Get the user's organization
      const userRecord = await db.collection('users').doc(authResult.userId).get();
      const userData = userRecord.data();
      
      if (userData?.organizationId) {
        query = query.where('organizationId', '==', userData.organizationId);
      }
    }
    
    // Apply limit
    query = query.limit(limit);
    
    // Execute the query
    const snapshot = await query.get();
    
    // Format the results
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamps to ISO strings for JSON serialization
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null,
      lastLogin: doc.data().lastLogin ? doc.data().lastLogin.toDate().toISOString() : null,
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error('Error getting users:', error);
    return NextResponse.json({ error: 'Error getting users' }, { status: 500 });
  }
} 