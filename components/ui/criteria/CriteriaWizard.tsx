import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
    ChevronRight,
    ChevronLeft,
    X,
    Save,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import { Domain, DomainWeight } from "@/types/assessment-criteria";
import { CriteriaFormState } from "@/hooks/useCriteriaBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CriteriaTypeSelector } from "./CriteriaTypeSelector";
import { CriteriaLevelConfig } from "./CriteriaLevelConfig";
import { CriteriaDomainWeight } from "./CriteriaDomainWeight";
import { CriteriaPreview } from "./CriteriaPreview";
import { CriteriaSpinner } from "./CriteriaSpinner";

interface CriteriaWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (state: CriteriaFormState) => Promise<boolean>;
    domains: Domain[];
    formState: CriteriaFormState;
    isLoading: boolean;
    isSaving: boolean;
    currentStep: "type" | "levels" | "domains" | "preview";
    errors: { levels?: string; domains?: string; general?: string };
    goToNextStep: () => boolean;
    goToPrevStep: () => void;
    updateForm: (updates: Partial<CriteriaFormState>) => void;
}

export const CriteriaWizard: React.FC<CriteriaWizardProps> = ({
    isOpen,
    onClose,
    onSave,
    domains,
    formState,
    isLoading,
    isSaving,
    currentStep,
    errors,
    goToNextStep,
    goToPrevStep,
    updateForm,
}) => {
    const t = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const isRtl = locale === "ar";

    // Calculate wizard progress
    const calculateProgress = (): number => {
        switch (currentStep) {
            case "type":
                return 25;
            case "levels":
                return 50;
            case "domains":
                return 75;
            case "preview":
                return 100;
            default:
                return 0;
        }
    };

    // Handle next button click
    const handleNext = async () => {
        // If on the final step, submit the form
        if (currentStep === "preview") {
            await onSave(formState);
            return;
        }

        // Otherwise, move to the next step
        goToNextStep();
    };

    // Render wizard title based on current step
    const renderStepTitle = () => {
        switch (currentStep) {
            case "type":
                return t("wizard.steps.type");
            case "levels":
                return t("wizard.steps.levels");
            case "domains":
                return t("wizard.steps.domains");
            case "preview":
                return t("wizard.steps.preview");
            default:
                return "";
        }
    };

    // Render different content based on current step
    const renderStepContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <CriteriaSpinner className="h-10 w-10 text-[var(--primary-blue)]" />
                    <p className="mt-4 text-gray-500">{t("wizard.loading")}</p>
                </div>
            );
        }

        switch (currentStep) {
            case "type":
                return (
                    <CriteriaTypeSelector
                        selectedType={formState.type}
                        onTypeSelect={(type) => updateForm({ type })}
                    />
                );
            case "levels":
                return (
                    <CriteriaLevelConfig
                        criteriaType={formState.type as "maturity" | "compliance"}
                        levels={formState.levels}
                        onChange={(levels) => updateForm({ levels })}
                        error={errors.levels}
                    />
                );
            case "domains":
                return (
                    <CriteriaDomainWeight
                        domains={domains}
                        domainWeights={formState.domainWeights}
                        onChange={(domainWeights) => updateForm({ domainWeights })}
                        error={errors.domains}
                    />
                );
            case "preview":
                return (
                    <CriteriaPreview
                        formState={formState}
                        domains={domains}
                        error={errors.general}
                    />
                );
            default:
                return null;
        }
    };

    // Animation variants
    const contentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    };

    // Calculate total weight
    const calculateTotalWeight = (): number => {
        return formState.domainWeights.reduce(
            (sum: number, d: DomainWeight) => sum + d.weight,
            0
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" dir={isRtl ? 'rtl' : 'ltr'}>
                <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">
                            {t("wizard.title")}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Wizard Progress */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span>{renderStepTitle()}</span>
                            <span>{calculateProgress()}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-[var(--primary-blue)] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${calculateProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Wizard Content */}
                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={contentVariants}
                            className="px-6 py-4"
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Wizard Footer */}
                <div className="px-6 py-4 border-t flex justify-between sticky bottom-0 bg-white dark:bg-gray-800 z-10">
                    <Button
                        variant="outline"
                        onClick={goToPrevStep}
                        disabled={currentStep === "type" || isLoading || isSaving}
                        className="flex items-center gap-2"
                    >
                        {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        {t("wizard.back")}
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={
                            isLoading ||
                            isSaving ||
                            (currentStep === "levels" && formState.type !== "percentage" && formState.levels.length === 0) ||
                            (currentStep === "preview" && Math.round(calculateTotalWeight()) !== 100)
                        }
                        className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white flex items-center gap-2"
                    >
                        {currentStep === "preview" ? (
                            <>
                                <Save className="h-4 w-4" />
                                {isSaving ? t("wizard.saving") : t("wizard.save")}
                                {isSaving && <CriteriaSpinner className="h-4 w-4 ml-2 text-white" size="sm" />}
                            </>
                        ) : (
                            <>
                                {t("wizard.next")}
                                {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 