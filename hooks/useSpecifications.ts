import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFirestore } from "@/lib/firestore";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

export interface VersionHistory {
  version: string;
  date: string | Timestamp;
  note?: {
    en: string;
    ar: string;
  };
}

export interface SubSpecification {
  id?: string;
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
}

// Define capability level type for better type safety
export type CapabilityLevel = "foundational" | "advanced" | "veryAdvanced";

export interface Specification {
  id: string;
  number: string;
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  capabilityLevel: CapabilityLevel;
  dependency?: {
    en: string;
    ar: string;
  };
  subSpecifications?: SubSpecification[];
  versionHistory?: VersionHistory[];
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

// Helper function to convert legacy numeric levels to string levels
export function convertLegacyCapabilityLevel(level: number | string): CapabilityLevel {
  if (typeof level === 'string' && (level === 'foundational' || level === 'advanced' || level === 'veryAdvanced')) {
    return level as CapabilityLevel;
  }
  
  // Convert numeric values to corresponding string values
  const numericLevel = typeof level === 'number' ? level : parseInt(level as string, 10);
  
  switch (numericLevel) {
    case 1: 
      return 'foundational';
    case 2:
    case 3: 
      return 'advanced';
    case 4:
    case 5:
      return 'veryAdvanced';
    default:
      return 'foundational';
  }
}

export default function useSpecifications(controlId?: string, frameworkId?: string, domainId?: string) {
  const params = useParams();
  const { db } = useFirestore();
  const { toast } = useToast();
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const effectiveControlId = controlId || (params?.controlId as string);
  const effectiveFrameworkId = frameworkId || (params?.frameworkId as string);
  const effectiveDomainId = domainId || (params?.domainId as string);

  useEffect(() => {
    if (!effectiveControlId || !effectiveFrameworkId || !effectiveDomainId) return;
    
    fetchSpecifications();
  }, [effectiveControlId, effectiveFrameworkId, effectiveDomainId]);

  // Get the path to the specifications collection
  const getSpecificationsPath = () => {
    return `frameworks/${effectiveFrameworkId}/domains/${effectiveDomainId}/controls/${effectiveControlId}/specifications`;
  };

  // Fetch specifications for the given control
  const fetchSpecifications = async () => {
    if (!effectiveControlId || !effectiveFrameworkId || !effectiveDomainId) return;

    setIsLoading(true);
    setError(null);

    try {
      const specificationsPath = getSpecificationsPath();
      const q = query(
        collection(db, specificationsPath),
        orderBy("number", "asc")
      );

      const querySnapshot = await getDocs(q);
      const specs: Specification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert legacy numeric capability levels to string format
        if (typeof data.capabilityLevel === 'number' || 
            (typeof data.capabilityLevel === 'string' && !isNaN(parseInt(data.capabilityLevel, 10)))) {
          data.capabilityLevel = convertLegacyCapabilityLevel(data.capabilityLevel);
        }
        
        specs.push({
          id: doc.id,
          ...data,
        } as Specification);
      });

      setSpecifications(specs);
    } catch (err: any) {
      console.error("Error fetching specifications:", err);
      
      // Check if it's an index error and provide a helpful message
      const isIndexError = err.message?.includes("index") || 
                         err.message?.includes("indexes") || 
                         err.message?.includes("require an index");
      
      const errorMessage = isIndexError
        ? "Index is being created. Please try again in a few minutes."
        : "Failed to fetch specifications. Please try again.";
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If it's a regular error (not an index error), retry after a delay
      if (!isIndexError) {
        setTimeout(() => {
          fetchSpecifications();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new specification
  const addSpecification = async (data: Omit<Specification, "id" | "createdAt" | "updatedAt">) => {
    if (!effectiveControlId || !effectiveFrameworkId || !effectiveDomainId) return;

    try {
      // Validate required fields
      if (!data.number || !data.name?.en || !data.name?.ar) {
        throw new Error("Missing required fields: number and name are required");
      }

      const now = new Date().toISOString();
      const newSpecification = {
        ...data,
        createdAt: now,
        updatedAt: now,
        // Ensure capabilityLevel is a valid string value
        capabilityLevel: data.capabilityLevel || 'foundational',
      };

      // Use the specification's number as the document ID
      const specificationId = data.number;
      const specificationsPath = getSpecificationsPath();
      const specRef = doc(db, specificationsPath, specificationId);
      
      await setDoc(specRef, newSpecification);
      
      setSpecifications((prev) => [
        ...prev,
        { ...newSpecification, id: specificationId } as Specification,
      ]);

      return specificationId;
    } catch (err: any) {
      console.error("Error adding specification:", err);
      
      // Provide more specific error message
      const errorMessage = err.message?.includes("Missing required fields") 
        ? err.message
        : "Failed to add specification. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Update an existing specification
  const updateSpecification = async (specId: string, data: Partial<Omit<Specification, "id" | "createdAt" | "updatedAt">>) => {
    if (!effectiveControlId || !effectiveFrameworkId || !effectiveDomainId) return;
    
    try {
      setRefreshing(specId);
      
      const specificationsPath = getSpecificationsPath();
      const specRef = doc(db, specificationsPath, specId);
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(specRef, updateData);
      
      setSpecifications((prev) =>
        prev.map((spec) =>
          spec.id === specId ? { ...spec, ...updateData } as Specification : spec
        )
      );
      
      toast({
        title: "Success",
        description: "Specification updated successfully",
      });
    } catch (err) {
      console.error("Error updating specification:", err);
      toast({
        title: "Error",
        description: "Failed to update specification. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setRefreshing(null);
    }
  };

  // Delete a specification
  const deleteSpecification = async (specId: string) => {
    if (!effectiveControlId || !effectiveFrameworkId || !effectiveDomainId) return;
    
    try {
      setRefreshing(specId);
      
      const specificationsPath = getSpecificationsPath();
      const specRef = doc(db, specificationsPath, specId);
      await deleteDoc(specRef);
      
      setSpecifications((prev) => prev.filter((spec) => spec.id !== specId));
      
      toast({
        title: "Success",
        description: "Specification deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting specification:", err);
      toast({
        title: "Error",
        description: "Failed to delete specification. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setRefreshing(null);
    }
  };

  // Import specifications from Excel
  const importSpecifications = async (data: Omit<Specification, "id" | "createdAt" | "updatedAt">[]) => {
    if (!effectiveControlId || !effectiveFrameworkId || !effectiveDomainId || !data.length) return;
    
    try {
      const now = new Date().toISOString();
      const newSpecs: Specification[] = [];
      const specificationsPath = getSpecificationsPath();
      
      for (const spec of data) {
        // Validate required fields
        if (!spec.number || !spec.name?.en || !spec.name?.ar) {
          console.warn("Skipping specification with missing required fields:", spec);
          continue;
        }
        
        const newSpec = {
          ...spec,
          createdAt: now,
          updatedAt: now,
          capabilityLevel: spec.capabilityLevel || 'foundational',
        };
        
        // Use the specification's number as the document ID
        const specificationId = spec.number;
        const specRef = doc(db, specificationsPath, specificationId);
        
        await setDoc(specRef, newSpec);
        newSpecs.push({ ...newSpec, id: specificationId } as Specification);
      }
      
      setSpecifications((prev) => [...prev, ...newSpecs]);
      
      toast({
        title: "Success",
        description: `${newSpecs.length} specifications imported successfully`,
      });
    } catch (err) {
      console.error("Error importing specifications:", err);
      toast({
        title: "Error",
        description: "Failed to import specifications. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    specifications,
    isLoading,
    error,
    refreshing,
    fetchSpecifications,
    addSpecification,
    updateSpecification,
    deleteSpecification,
    importSpecifications,
  };
} 