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

export interface Domain {
  domainId: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  domainField?: {
    en: string;
    ar: string;
  };
  defaultLang: string;
}

export function useDomains(frameworkId: string) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = async () => {
    setLoading(true);
    setError(null);
    try {
      const domainsCollection = collection(db, `frameworks/${frameworkId}/domains`);
      const domainsSnapshot = await getDocs(domainsCollection);
      const domainsList = domainsSnapshot.docs.map(doc => {
        const data = doc.data() as Domain;
        return {
          ...data,
          domainId: doc.id
        };
      });
      setDomains(domainsList);
      return domainsList;
    } catch (err) {
      console.error("Error fetching domains:", err);
      setError("Failed to fetch domains");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getDomain = async (domainId: string): Promise<Domain | null> => {
    try {
      const domainRef = doc(db, `frameworks/${frameworkId}/domains`, domainId);
      const domainSnapshot = await getDoc(domainRef);
      
      if (domainSnapshot.exists()) {
        return { ...domainSnapshot.data() as Domain, domainId: domainSnapshot.id };
      }
      return null;
    } catch (err) {
      console.error("Error fetching domain:", err);
      setError("Failed to fetch domain details");
      return null;
    }
  };

  const createDomain = async (domain: Omit<Domain, 'domainId'>, domainId: string): Promise<boolean> => {
    try {
      // Check if domain with this ID already exists
      const domainRef = doc(db, `frameworks/${frameworkId}/domains`, domainId);
      const domainSnapshot = await getDoc(domainRef);
      
      if (domainSnapshot.exists()) {
        setError("A domain with this ID already exists");
        return false;
      }
      
      // Create domain with specific ID
      await setDoc(domainRef, {
        ...domain,
        domainId
      });
      
      await fetchDomains();
      return true;
    } catch (err) {
      console.error("Error creating domain:", err);
      setError("Failed to create domain");
      return false;
    }
  };

  const updateDomain = async (domainId: string, data: Partial<Domain>): Promise<boolean> => {
    try {
      const domainRef = doc(db, `frameworks/${frameworkId}/domains`, domainId);
      await updateDoc(domainRef, data);
      await fetchDomains();
      return true;
    } catch (err) {
      console.error("Error updating domain:", err);
      setError("Failed to update domain");
      return false;
    }
  };

  const deleteDomain = async (domainId: string): Promise<boolean> => {
    try {
      const domainRef = doc(db, `frameworks/${frameworkId}/domains`, domainId);
      await deleteDoc(domainRef);
      await fetchDomains();
      return true;
    } catch (err) {
      console.error("Error deleting domain:", err);
      setError("Failed to delete domain");
      return false;
    }
  };

  useEffect(() => {
    if (frameworkId) {
      fetchDomains();
    }
  }, [frameworkId]);

  return {
    domains,
    loading,
    error,
    fetchDomains,
    getDomain,
    createDomain,
    updateDomain,
    deleteDomain
  };
} 