import { useState, useEffect } from "react";
import { 
  AssessmentCriteria, 
  CriteriaType, 
  CriteriaLevel, 
  DomainWeight,
  Domain
} from "@/types/assessment-criteria";
import { 
  getAssessmentCriteria, 
  saveAssessmentCriteria,
  deleteAssessmentCriteria,
  getFrameworkDomains
} from "@/lib/services/assessmentCriteriaService";
import { useTranslations } from "next-intl";

// Steps in the criteria wizard
export type WizardStep = "type" | "levels" | "domains" | "preview";

interface ValidationErrors {
  levels?: string;
  domains?: string;
  general?: string;
}

export interface CriteriaFormState {
  type: CriteriaType;
  levels: CriteriaLevel[];
  domainWeights: DomainWeight[];
}

export function useCriteriaBuilder(frameworkId: string) {
  // Translation hooks
  const t = useTranslations("CriteriaBuilder");

  // Form state
  const [formState, setFormState] = useState<CriteriaFormState>({
    type: "percentage",
    levels: [],
    domainWeights: []
  });

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasCriteria, setHasCriteria] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);

  // Fetch existing criteria and domains when the component mounts
  useEffect(() => {
    const fetchCriteriaAndDomains = async () => {
      try {
        setIsLoading(true);
        const [criteriaData, domainsData] = await Promise.all([
          getAssessmentCriteria(frameworkId),
          getFrameworkDomains(frameworkId)
        ]);

        // Set domains
        setDomains(domainsData);

        // Initialize domain weights if not already set
        if (formState.domainWeights.length === 0 && domainsData.length > 0) {
          const equalWeight = Math.floor(100 / domainsData.length);
          const remainingWeight = 100 - (equalWeight * domainsData.length);
          
          const weights: DomainWeight[] = domainsData.map((domain, index) => ({
            domainId: domain.id,
            weight: index === 0 ? equalWeight + remainingWeight : equalWeight
          }));
          
          setFormState(prev => ({
            ...prev,
            domainWeights: weights
          }));
        }

        // Set existing criteria data if available
        if (criteriaData) {
          setFormState({
            type: criteriaData.type,
            levels: criteriaData.levels || [],
            domainWeights: criteriaData.domainWeights
          });
          setHasCriteria(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchCriteriaAndDomains();
    }
  }, [frameworkId, isOpen]);

  // Validate form data based on the current step
  const validateCurrentStep = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    switch (currentStep) {
      case "levels":
        if (formState.type !== "percentage" && formState.levels.length === 0) {
          newErrors.levels = t("errors.noLevels");
          isValid = false;
        } else if (formState.type !== "percentage") {
          // Check that levels have increasing values
          const values = formState.levels.map(level => level.value);
          const isSorted = values.every((val, i) => i === 0 || val > values[i - 1]);
          
          if (!isSorted) {
            newErrors.levels = t("errors.levelOrder");
            isValid = false;
          }
          
          // Check that level values are between 0 and 100
          const validRange = values.every(val => val >= 0 && val <= 100);
          if (!validRange) {
            newErrors.levels = t("errors.levelRange");
            isValid = false;
          }
        }
        break;
        
      case "domains":
        // Check that domain weights sum to 100%
        const totalWeight = formState.domainWeights.reduce((sum, domain) => sum + domain.weight, 0);
        if (Math.round(totalWeight) !== 100) {
          newErrors.domains = t("errors.weightSum", { sum: totalWeight });
          isValid = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Move to the next step in the wizard
  const goToNextStep = (): boolean => {
    if (!validateCurrentStep()) {
      return false;
    }

    switch (currentStep) {
      case "type":
        setCurrentStep(formState.type === "percentage" ? "domains" : "levels");
        break;
      case "levels":
        setCurrentStep("domains");
        break;
      case "domains":
        setCurrentStep("preview");
        break;
      case "preview":
        // Final step, submit form
        return true;
    }

    return false;
  };

  // Move to the previous step in the wizard
  const goToPrevStep = () => {
    switch (currentStep) {
      case "levels":
        setCurrentStep("type");
        break;
      case "domains":
        setCurrentStep(formState.type === "percentage" ? "type" : "levels");
        break;
      case "preview":
        setCurrentStep("domains");
        break;
    }
  };

  // Update form state when a field changes
  const updateForm = (updates: Partial<CriteriaFormState>) => {
    setFormState(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Save the criteria to Firestore
  const saveCriteria = async (): Promise<boolean> => {
    try {
      if (!validateCurrentStep()) {
        return false;
      }

      setIsSaving(true);
      await saveAssessmentCriteria(
        frameworkId,
        formState.type,
        formState.domainWeights,
        formState.type !== "percentage" ? formState.levels : undefined
      );

      setHasCriteria(true);
      setIsOpen(false);
      return true;
    } catch (error) {
      console.error("Error saving criteria:", error);
      setErrors({ general: t("errors.saveFailed") });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete the criteria from Firestore
  const deleteCriteria = async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      await deleteAssessmentCriteria(frameworkId);
      
      setHasCriteria(false);
      setIsDeleteModalOpen(false);
      return true;
    } catch (error) {
      console.error("Error deleting criteria:", error);
      setErrors({ general: t("errors.deleteFailed") });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Open the wizard
  const openWizard = () => {
    setCurrentStep("type");
    setErrors({});
    setIsOpen(true);
  };

  // Close the wizard
  const closeWizard = () => {
    setIsOpen(false);
  };

  return {
    formState,
    updateForm,
    currentStep,
    isOpen,
    isLoading,
    isSaving,
    errors,
    hasCriteria,
    domains,
    goToNextStep,
    goToPrevStep,
    saveCriteria,
    deleteCriteria,
    openWizard,
    closeWizard,
    isDeleteModalOpen,
    setIsDeleteModalOpen
  };
} 