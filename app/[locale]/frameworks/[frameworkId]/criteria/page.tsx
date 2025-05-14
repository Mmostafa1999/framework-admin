"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    BookOpen,
    ChevronRight,
    Plus,
    ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CriteriaWizard } from "@/components/ui/criteria/CriteriaWizard";
import { CriteriaSummary } from "@/components/ui/criteria/CriteriaSummary";
import { NoCriteria } from "@/components/ui/criteria/NoCriteria";
import { CriteriaSpinner } from "@/components/ui/criteria/CriteriaSpinner";
import { useCriteriaBuilder } from "@/hooks/useCriteriaBuilder";
import { getAssessmentCriteria, getFrameworkDomains } from "@/lib/services/assessmentCriteriaService";
import { AssessmentCriteria, Domain } from "@/types/assessment-criteria";

export default function FrameworkCriteriaPage() {
    const t = useTranslations("FrameworkManagement");
    const sidebarT = useTranslations("Sidebar");
    const criteriaT = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const params = useParams();
    const isRtl = locale === "ar";
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const frameworkId = params.frameworkId as string;

    // States
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialCriteria, setInitialCriteria] = useState<AssessmentCriteria | null>(null);
    const [domains, setDomains] = useState<Domain[]>([]);

    // Use the criteria builder hook
    const criteriaBuilder = useCriteriaBuilder(frameworkId);

    // Fetch domains separately to ensure they're always loaded
    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const domainsData = await getFrameworkDomains(frameworkId);
                setDomains(domainsData);
            } catch (error) {
                console.error("Error fetching domains:", error);
            }
        };

        fetchDomains();
    }, [frameworkId]);

    // Fetch initial criteria data
    useEffect(() => {
        const fetchInitialCriteria = async () => {
            try {
                setIsInitialLoading(true);
                const criteria = await getAssessmentCriteria(frameworkId);
                setInitialCriteria(criteria);
                setIsInitialLoading(false);
            } catch (error) {
                console.error("Error fetching initial criteria:", error);
                setIsInitialLoading(false);
            }
        };

        fetchInitialCriteria();
    }, [frameworkId, criteriaBuilder.hasCriteria]);

    // Refresh criteria data when the wizard is closed after saving
    useEffect(() => {
        if (!criteriaBuilder.isOpen && !isInitialLoading) {
            const refreshCriteria = async () => {
                try {
                    const criteria = await getAssessmentCriteria(frameworkId);
                    setInitialCriteria(criteria);
                } catch (error) {
                    console.error("Error refreshing criteria:", error);
                }
            };

            refreshCriteria();
        }
    }, [criteriaBuilder.isOpen, frameworkId, isInitialLoading]);

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] text-white">
                {/* Glowing decorative background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/5 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    {/* Breadcrumbs */}
                    <div className="flex items-center mb-4 text-sm">
                        <Link href={`/${locale}/frameworks`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <BookOpen className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{sidebarT("frameworkManagement")}</span>
                        </Link>
                        <ChevronRight className={`h-4 w-4 mx-2 ${isRtl ? 'rotate-180' : ''}`} />
                        <Link href={`/${locale}/frameworks/${frameworkId}`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <span>{frameworkId}</span>
                        </Link>
                        <ChevronRight className={`h-4 w-4 mx-2 ${isRtl ? 'rotate-180' : ''}`} />
                        <span className="opacity-90">{t("criteria")}</span>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            {t("frameworkAssessmentCriteria", { framework: frameworkId })}
                        </h1>
                        <p className="text-white/80 max-w-3xl">
                            {t("frameworkAssessmentDescription", { framework: frameworkId })}
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Card className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        {isInitialLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <CriteriaSpinner size="lg" className="text-[var(--primary-blue)]" />
                                <p className="mt-4 text-gray-500">{criteriaT("summary.loadingCriteria")}</p>
                            </div>
                        ) : initialCriteria ? (
                            <CriteriaSummary
                                criteria={initialCriteria}
                                domains={domains}
                                onEdit={criteriaBuilder.openWizard}
                                onDelete={criteriaBuilder.deleteCriteria}
                                isDeleting={criteriaBuilder.isSaving}
                                isDeleteModalOpen={criteriaBuilder.isDeleteModalOpen}
                                onDeleteModalOpenChange={criteriaBuilder.setIsDeleteModalOpen}
                            />
                        ) : (
                            <NoCriteria onCreateCriteria={criteriaBuilder.openWizard} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Criteria Wizard */}
            <CriteriaWizard
                isOpen={criteriaBuilder.isOpen}
                onClose={criteriaBuilder.closeWizard}
                onSave={criteriaBuilder.saveCriteria}
                domains={domains.length > 0 ? domains : criteriaBuilder.domains}
                formState={criteriaBuilder.formState}
                isLoading={criteriaBuilder.isLoading}
                isSaving={criteriaBuilder.isSaving}
                currentStep={criteriaBuilder.currentStep}
                errors={criteriaBuilder.errors}
                goToNextStep={criteriaBuilder.goToNextStep}
                goToPrevStep={criteriaBuilder.goToPrevStep}
                updateForm={criteriaBuilder.updateForm}
            />
        </div>
    );
} 