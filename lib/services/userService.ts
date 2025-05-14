import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdToken,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  organizationId: string;
  assignedProjectIds: string[];
  createdAt: Timestamp | string | null;
  lastLogin: Timestamp | string | null;
  locale?: string; // Store user's preferred language
}

// Function to create a new user (admin only)
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: string,
  organizationId: string,
  assignedProjectIds: string[] = [],
  status: string = "Active",
  locale?: string
): Promise<string> {
  try {
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        role,
        organizationId,
        assignedProjectIds,
        status,
        locale
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create user');
    }

    const data = await response.json();
    return data.userId;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Function to get a user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

// Function to get all users
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get users');
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

// Function to update a user
export async function updateUser(
  userId: string, 
  userData: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const response = await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...userData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Function to update user status (Active/Inactive)
export async function updateUserStatus(userId: string, status: string): Promise<void> {
  try {
    await updateUser(userId, { status });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}

// Function to delete a user
export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/admin/delete-user?userId=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// Function to sign in a user and establish a session
export async function signInUser(email: string, password: string): Promise<User> {
  try {
    // Sign in with Firebase Auth (client-side)
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get the ID token
    const idToken = await getIdToken(userCredential.user);
    
    // Create a session cookie via our API
    const sessionResponse = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!sessionResponse.ok) {
      await firebaseSignOut(auth);
      throw new Error('Failed to establish session');
    }
    
    // Get user data from session endpoint
    const userResponse = await fetch('/api/auth/session', {
      method: 'GET',
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user data');
    }

    const userData = await userResponse.json();
    
    if (!userData.authenticated) {
      throw new Error('Authentication failed');
    }

    // Get full user data from the users API
    const fullUserData = await getUserById(userData.uid);
    
    if (!fullUserData) {
      await firebaseSignOut(auth);
      throw new Error('User not found in database');
    }
    
    if (fullUserData.status !== 'Active') {
      await firebaseSignOut(auth);
      throw new Error('User account is inactive');
    }
    
    return fullUserData;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

// Function to sign out
export async function signOut(): Promise<void> {
  try {
    // Sign out from Firebase Auth
    await firebaseSignOut(auth);
    
    // Delete the session cookie
    await fetch('/api/auth/session', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// Function to get users by organization
export async function getUsersByOrganization(organizationId: string): Promise<User[]> {
  try {
    const response = await fetch(`/api/users?organization=${organizationId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get users by organization');
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error getting users by organization:", error);
    throw error;
  }
}

// Function to get users by role
export async function getUsersByRole(role: string): Promise<User[]> {
  try {
    const response = await fetch(`/api/users?role=${role}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get users by role');
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error getting users by role:", error);
    throw error;
  }
} 