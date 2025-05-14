import { db } from "../firebase";

/**
 * Hook to access Firestore database instance
 * @returns The Firestore database instance
 */
export const useFirestore = () => {
  return {
    db
  };
};

export * from "./importExcel"; 