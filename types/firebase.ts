import { Timestamp } from "firebase/firestore";

// User in Firestore
export interface FirestoreUser {
  name: string;
  email: string;
  role: string;
  status: string;
  organizationId: string;
  assignedProjectIds: string[];
  createdAt: Timestamp | null;
  lastLogin: Timestamp | null;
  locale?: string;
  photoURL?: string;
}

// User with ID (for frontend use)
export interface User extends FirestoreUser {
  id: string;
}

// Organization in Firestore
export interface FirestoreOrganization {
  name: Record<string, string>; // Multilingual support: { en: "Name in English", ar: "Name in Arabic" }
  description?: Record<string, string>; // Multilingual support (optional)
  defaultLang?: string; // Default language used for the organization name
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  logoUrl?: string;
  projectIds?: string[]; // List of project IDs assigned to this organization
}

// Organization with ID (for frontend use)
export interface Organization extends FirestoreOrganization {
  id: string;
}

// Framework in Firestore
export interface FirestoreFramework {
  name: string; // English only as specified in requirements
  description: {
    [key: string]: string;
  }; // Multilingual support for descriptions
  defaultLang?: string; // Default language used for description (generally 'en')
  updatedAt: Timestamp | null;
  createdAt?: Timestamp | null; // Optional now for backward compatibility
}

// Framework with ID (for frontend use)
export interface Framework extends FirestoreFramework {
  id: string;
}

// Project in Firestore
export interface FirestoreProject {
  name: Record<string, string>; // Multilingual support
  description: Record<string, string>; // Multilingual support
  organizationId: string;
  startDate: string;
  projectDeadline: string;
  status: string; // open | closed | on-holding
  frameworkId: string;
  defaultLang: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// Project with ID (for frontend use)
export interface Project extends FirestoreProject {
  id: string;
}

// Type guard function to check if an object has multilingual support
export function hasMultilingualSupport(obj: any, field: string): obj is { [field: string]: Record<string, string> } {
  return obj && 
    typeof obj[field] === 'object' && 
    obj[field] !== null &&
    (obj[field].en !== undefined || obj[field].ar !== undefined);
}

// Helper function to get localized value from a multilingual field
export function getLocalizedValue(
  obj: Record<string, string> | undefined, 
  locale: string, 
  fallbackLocale: string = 'en',
  defaultLang?: string
): string {
  if (!obj) return '';
  
  // First try the requested locale
  if (obj[locale]) return obj[locale];
  
  // Then try the defaultLang if provided
  if (defaultLang && obj[defaultLang]) return obj[defaultLang];
  
  // Finally fall back to the fallbackLocale
  return obj[fallbackLocale] || Object.values(obj)[0] || '';
} 