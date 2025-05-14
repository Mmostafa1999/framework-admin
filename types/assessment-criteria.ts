import { Timestamp } from "firebase/firestore";

// Localized text with English and Arabic support
export interface LocalizedText {
  en: string;
  ar: string;
}

// Criteria level for maturity or compliance types
export interface CriteriaLevel {
  label: LocalizedText;
  value: number; // percentage value
  description: LocalizedText;
}

// Domain weight for percentage distribution
export interface DomainWeight {
  domainId: string;
  weight: number; // percentage value (0-100)
}

// Types of assessment criteria
export type CriteriaType = "percentage" | "maturity" | "compliance";

// Assessment criteria stored in Firestore
export interface AssessmentCriteria {
  frameworkId: string;
  type: CriteriaType;
  levels?: CriteriaLevel[]; // Only for maturity or compliance types
  domainWeights: DomainWeight[];
  createdAt: Timestamp;
}

// Domain interface (simplified, used for domain selection in criteria)
export interface Domain {
  id: string;
  name: LocalizedText;
} 