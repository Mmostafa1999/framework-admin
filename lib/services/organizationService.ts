import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Organization, FirestoreOrganization } from "@/types/firebase";

/**
 * Create a new organization in Firestore
 */
export async function createOrganization(
  name: Record<string, string>,
  projectIds: string[] = []
): Promise<string> {
  try {
    const organizationData: FirestoreOrganization = {
      name,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      projectIds: projectIds
    };

    const docRef = await addDoc(collection(db, "organizations"), organizationData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
  }
}

/**
 * Get an organization by ID
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
  try {
    const docRef = doc(db, "organizations", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as FirestoreOrganization;
    return {
      id: docSnap.id,
      ...data
    };
  } catch (error) {
    console.error("Error getting organization:", error);
    throw error;
  }
}

/**
 * Get all organizations
 */
export async function getAllOrganizations(): Promise<Organization[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "organizations"));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Organization[];
  } catch (error) {
    console.error("Error getting all organizations:", error);
    throw error;
  }
}

/**
 * Update an organization
 */
export async function updateOrganization(
  id: string,
  updates: Partial<Omit<FirestoreOrganization, 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, "organizations", id);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error;
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganization(id: string): Promise<void> {
  try {
    const docRef = doc(db, "organizations", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting organization:", error);
    throw error;
  }
}

/**
 * Get organizations by project ID
 */
export async function getOrganizationsByProject(projectId: string): Promise<Organization[]> {
  try {
    const q = query(
      collection(db, "organizations"),
      where("projectIds", "array-contains", projectId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Organization[];
  } catch (error) {
    console.error("Error getting organizations by project:", error);
    throw error;
  }
} 