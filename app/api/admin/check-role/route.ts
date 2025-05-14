import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/middleware/authorize";
import { auth } from "@/lib/firebase-admin";
import { db as adminDb } from "@/lib/firebase-admin";

// GET to check the user's role and authentication status
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user using the authorize middleware
    // Allow any authenticated user to access this route
    const authResult = await authorize(req, ["Admin", "Client", "Consultant"]);
    
    if (authResult instanceof NextResponse) {
      // If authorization failed, return the error response
      return authResult;
    }

    // Get the user's ID and role from the authorization result
    const { userId, role } = authResult;

    // Get additional user information from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Get the user from Firebase Auth for additional verification
    const userRecord = await auth.getUser(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        role, // Role from auth custom claims
        email: userRecord.email,
        firestoreData: userData ? {
          role: userData.role, // Role from Firestore
          // Include other safe fields to return
          name: userData.name,
          status: userData.status,
        } : null,
        isAdmin: role === "Admin", // Boolean flag indicating if admin
        claims: userRecord.customClaims || {}
      },
      message: "User authentication and role check successful"
    });
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Failed to check user role", details: (error as Error).message },
      { status: 500 }
    );
  }
} 