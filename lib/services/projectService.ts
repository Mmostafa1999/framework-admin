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
import { Project, FirestoreProject } from "@/types/firebase";

// Collection name constant
const PROJECTS_COLLECTION = "projects";

/**
 * Create a new project in Firestore
 */
export async function createProject(
  name: Record<string, string>,
  description: Record<string, string>,
  owner: string,
  startDate: string,
  projectDeadline: string,
  status: string = "open",
  frameworkId: string,
  defaultLang: string = "en"
): Promise<string> {
  try {
    const projectData: FirestoreProject = {
      name,
      description,
      organizationId: owner,
      startDate,
      projectDeadline,
      status,
      frameworkId,
      defaultLang,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

/**
 * Get all projects from Firestore
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    const querySnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error("Error getting all projects:", error);
    throw error;
  }
}

/**
 * Get a project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Project;
  } catch (error) {
    console.error("Error getting project by ID:", error);
    throw error;
  }
}

/**
 * Update a project in Firestore
 */
export async function updateProject(id: string, data: Partial<FirestoreProject>): Promise<void> {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, id);
    
    // Add the updated timestamp
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(projectRef, updateData);
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

/**
 * Delete a project from Firestore
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PROJECTS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

/**
 * Get projects by organization ID
 */
export async function getProjectsByOrganization(organizationId: string): Promise<Project[]> {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("organizationId", "==", organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error("Error getting projects by organization:", error);
    throw error;
  }
}

/**
 * Get projects by status
 */
export async function getProjectsByStatus(status: string): Promise<Project[]> {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("status", "==", status)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error("Error getting projects by status:", error);
    throw error;
  }
}

/**
 * Get projects by framework
 */
export async function getProjectsByFramework(frameworkId: string): Promise<Project[]> {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("frameworkId", "==", frameworkId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error("Error getting projects by framework:", error);
    throw error;
  }
} 