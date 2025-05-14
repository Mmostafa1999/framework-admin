import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Control {
  controlId: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  dimension: "plan" | "implement" | "operate";
}

export function useControls(frameworkId: string, domainId: string) {
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchControls = async () => {
    setLoading(true);
    setError(null);
    try {
      const controlsCollection = collection(db, `frameworks/${frameworkId}/domains/${domainId}/controls`);
      const controlsSnapshot = await getDocs(controlsCollection);
      const controlsList = controlsSnapshot.docs.map(doc => {
        const data = doc.data() as Control;
        return {
          ...data,
          controlId: doc.id
        };
      });
      setControls(controlsList);
      return controlsList;
    } catch (err) {
      console.error("Error fetching controls:", err);
      setError("Failed to fetch controls");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getControl = async (controlId: string): Promise<Control | null> => {
    try {
      const controlRef = doc(db, `frameworks/${frameworkId}/domains/${domainId}/controls`, controlId);
      const controlSnapshot = await getDoc(controlRef);
      
      if (controlSnapshot.exists()) {
        return { ...controlSnapshot.data() as Control, controlId: controlSnapshot.id };
      }
      return null;
    } catch (err) {
      console.error("Error fetching control:", err);
      setError("Failed to fetch control details");
      return null;
    }
  };

  const createControl = async (control: Omit<Control, 'controlId'>, controlId: string): Promise<boolean> => {
    try {
      // Check if control with this ID already exists
      const controlRef = doc(db, `frameworks/${frameworkId}/domains/${domainId}/controls`, controlId);
      const controlSnapshot = await getDoc(controlRef);
      
      if (controlSnapshot.exists()) {
        setError("A control with this ID already exists");
        return false;
      }
      
      // Create control with specific ID
      await setDoc(controlRef, {
        ...control,
        controlId
      });
      
      await fetchControls();
      return true;
    } catch (err) {
      console.error("Error creating control:", err);
      setError("Failed to create control");
      return false;
    }
  };

  const updateControl = async (controlId: string, data: Partial<Control>): Promise<boolean> => {
    try {
      const controlRef = doc(db, `frameworks/${frameworkId}/domains/${domainId}/controls`, controlId);
      await updateDoc(controlRef, data);
      await fetchControls();
      return true;
    } catch (err) {
      console.error("Error updating control:", err);
      setError("Failed to update control");
      return false;
    }
  };

  const deleteControl = async (controlId: string): Promise<boolean> => {
    try {
      const controlRef = doc(db, `frameworks/${frameworkId}/domains/${domainId}/controls`, controlId);
      await deleteDoc(controlRef);
      await fetchControls();
      return true;
    } catch (err) {
      console.error("Error deleting control:", err);
      setError("Failed to delete control");
      return false;
    }
  };

  useEffect(() => {
    if (frameworkId && domainId) {
      fetchControls();
    }
  }, [frameworkId, domainId]);

  return {
    controls,
    loading,
    error,
    fetchControls,
    getControl,
    createControl,
    updateControl,
    deleteControl
  };
} 