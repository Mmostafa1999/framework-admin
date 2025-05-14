import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { AssessmentCriteria, CriteriaType, DomainWeight, CriteriaLevel, Domain, LocalizedText } from "@/types/assessment-criteria";

const ASSESSMENT_CRITERIA_COLLECTION = "assessmentCriteria";

/**
 * Get assessment criteria for a framework
 */
export async function getAssessmentCriteria(frameworkId: string): Promise<AssessmentCriteria | null> {
  try {
    const docRef = doc(db, ASSESSMENT_CRITERIA_COLLECTION, frameworkId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data() as AssessmentCriteria;
  } catch (error) {
    console.error(`Error getting assessment criteria for framework ${frameworkId}:`, error);
    throw error;
  }
}

/**
 * Save assessment criteria for a framework
 */
export async function saveAssessmentCriteria(
  frameworkId: string,
  type: CriteriaType,
  domainWeights: DomainWeight[],
  levels?: CriteriaLevel[]
): Promise<void> {
  try {
    const docRef = doc(db, ASSESSMENT_CRITERIA_COLLECTION, frameworkId);
    
    const criteriaData: AssessmentCriteria = {
      frameworkId,
      type,
      domainWeights,
      createdAt: Timestamp.now(),
    };
    
    // Add levels if type is maturity or compliance
    if (type !== "percentage" && levels && levels.length > 0) {
      criteriaData.levels = levels;
    }
    
    
    await setDoc(docRef, criteriaData);
  } catch (error) {
    console.error(`Error saving assessment criteria for framework ${frameworkId}:`, error);
    throw error;
  }
}

/**
 * Delete assessment criteria for a framework
 */
export async function deleteAssessmentCriteria(frameworkId: string): Promise<void> {
  try {
    const docRef = doc(db, ASSESSMENT_CRITERIA_COLLECTION, frameworkId);
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting assessment criteria for framework ${frameworkId}:`, error);
    throw error;
  }
}

/**
 * Get domains for a framework from the domains collection
 * This is a simplified implementation, assuming domains are stored in a "domains" collection
 * with a subcollection under each framework
 */
export async function getFrameworkDomains(frameworkId: string): Promise<Domain[]> {
  try {
    const domainsCollection = collection(db, "frameworks", frameworkId, "domains");
    const domainsSnapshot = await getDocs(domainsCollection);
    
    return domainsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name as LocalizedText
    }));
  } catch (error) {
    console.error(`Error getting domains for framework ${frameworkId}:`, error);
    throw error;
  }
}
