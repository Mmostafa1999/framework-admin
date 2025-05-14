import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    setDoc,
} from "firebase/firestore";
import { Framework, FirestoreFramework } from "@/types/firebase";

const FRAMEWORKS_COLLECTION = "frameworks";

/**
 * Get all frameworks from Firestore
 */
export async function getAllFrameworks(): Promise<Framework[]> {
    try {
        const querySnapshot = await getDocs(collection(db, FRAMEWORKS_COLLECTION));
        
        const frameworks = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Framework[];
        
        return frameworks;
    } catch (error) {
        console.error("Error getting all frameworks:", error);
        throw error;
    }
}

/**
 * Get a single framework by ID
 */
export async function getFrameworkById(id: string): Promise<Framework | null> {
    try {
        const docRef = doc(db, FRAMEWORKS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data() as FirestoreFramework;
        return {
            id: docSnap.id,
            ...data
        };
    } catch (error) {
        console.error(`Error getting framework with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new framework
 */
export async function createFramework(
    name: string, 
    description: { [key: string]: string },
): Promise<string> {
    try {
        // Validate inputs
        if (!name || name.trim() === '') {
            throw new Error("Framework name is required");
        }
        
        if (!description || !description.en || description.en.trim() === '') {
            throw new Error("Framework description in English is required");
        }
        
        const frameworkData: FirestoreFramework = {
            name,
            description,
            defaultLang: "en",
            updatedAt: serverTimestamp() as Timestamp
        };

        
        const docRef = await addDoc(collection(db, FRAMEWORKS_COLLECTION), frameworkData);
        
        return docRef.id;
    } catch (error) {
        console.error("Error creating framework:", error);
        throw error;
    }
}

/**
 * Update an existing framework
 */
export async function updateFramework(
    id: string,
    updates: {
        name?: string;
        description?: { en: string; ar?: string };
    }
): Promise<void> {
    try {
        // Validate inputs
        if (updates.name !== undefined && updates.name.trim() === '') {
            throw new Error("Framework name cannot be empty");
        }
        
        if (updates.description && (!updates.description.en || updates.description.en.trim() === '')) {
            throw new Error("Framework description in English is required");
        }
        
        const docRef = doc(db, FRAMEWORKS_COLLECTION, id);
        
        // Add timestamp to updates
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };
        
        
        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error(`Error updating framework with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Delete a framework by ID
 */
export async function deleteFramework(id: string): Promise<void> {
    try {
        const docRef = doc(db, FRAMEWORKS_COLLECTION, id);
        
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting framework with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Create or update the NPC framework document with fixed ID "npc"
 */
export async function createOrUpdateNPCFramework(): Promise<void> {
    try {
        // Create the NPC framework data
        const frameworkData: FirestoreFramework = {
            name: "NPC",
            description: {
                en: "Manage the NPC enterprise framework and its domains.",
                ar: "إدارة إطار عمل المؤسسة NPC ومجالاتها."
            },
            defaultLang: "en",
            updatedAt: serverTimestamp() as Timestamp
        };

        
        // Use setDoc to create or update the document with a specific ID
        const docRef = doc(db, FRAMEWORKS_COLLECTION, "npc");
        await setDoc(docRef, frameworkData);
        
    } catch (error) {
        console.error("Error creating/updating NPC framework:", error);
        throw error;
    }
}

/**
 * Migrate old framework ID to the new "npc" ID if the old one exists
 * @param oldId The old framework ID to check and migrate
 */
export async function migrateToNpcFramework(oldId: string): Promise<boolean> {
    try {
        // Check if the old document exists
        const oldDocRef = doc(db, FRAMEWORKS_COLLECTION, oldId);
        const oldDocSnap = await getDoc(oldDocRef);
        
        if (oldDocSnap.exists()) {
            
            // Get the data from the old document
            const oldData = oldDocSnap.data() as FirestoreFramework;
            
            // Create or update the 'npc' document with the same data
            const npcDocRef = doc(db, FRAMEWORKS_COLLECTION, "npc");
            await setDoc(npcDocRef, {
                ...oldData,
                updatedAt: serverTimestamp() as Timestamp
            });
            
            
            // Delete the old document
            await deleteDoc(oldDocRef);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error("Error migrating framework:", error);
        throw error;
    }
} 