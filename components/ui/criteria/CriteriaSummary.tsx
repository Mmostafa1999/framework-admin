import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Edit2, Trash2, BarChart, AlertCircle, Gauge, PercentIcon, FileCheck } from "lucide-react";
import { AssessmentCriteria, Domain } from "@/types/assessment-criteria";
import { CriteriaFormState } from "@/hooks/useCriteriaBuilder";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CriteriaSummaryProps {
    criteria: AssessmentCriteria;
    domains: Domain[];
    onEdit: () => void;
    onDelete: () => Promise<boolean>;
    isDeleting: boolean;
    isDeleteModalOpen: boolean;
    onDeleteModalOpenChange: (open: boolean) => void;
}

export const CriteriaSummary: React.FC<CriteriaSummaryProps> = ({
    criteria,
    domains,
    onEdit,
    onDelete,
    isDeleting,
    isDeleteModalOpen,
    onDeleteModalOpenChange,
}) => {
    const t = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const isRtl = locale === "ar";

    // Get domain name based on domain ID
    const getDomainName = (domainId: string): string => {
        const domain = domains.find((d) => d.id === domainId);
        return domain ? domain.name[locale === "ar" ? "ar" : "en"] : domainId;
    };

    // Calculate total domain weight
    const totalWeight = criteria.domainWeights.reduce(
        (sum, domain) => sum + domain.weight,
        0
    );

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="p-6">
            <motion.div
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Summary Header */}
                <motion.div variants={itemVariants} className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">
                            {t("summary.title")}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                            {t("summary.description")}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className="flex items-center gap-2"
                        >
                            <Edit2 className="h-4 w-4" />
                            {t("summary.editButton")}
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => onDeleteModalOpenChange(true)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            {t("summary.deleteButton")}
                        </Button>
                    </div>
                </motion.div>

                {/* Criteria Type */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6"
                >
                    <div className="flex items-center mb-4">
                        {criteria.type === "percentage" ? (
                            <PercentIcon className="h-6 w-6 text-blue-500 mr-3" />
                        ) : criteria.type === "maturity" ? (
                            <Gauge className="h-6 w-6 text-green-500 mr-3" />
                        ) : (
                            <FileCheck className="h-6 w-6 text-purple-500 mr-3" />
                        )}

                        <h3 className="text-xl font-medium">
                            {t(`typeSelector.types.${criteria.type}.title`)}
                        </h3>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {t(`typeSelector.types.${criteria.type}.description`)}
                    </p>

                    {/* Weight Distribution Check */}
                    <div
                        className={`flex items-center p-4 rounded-lg ${Math.round(totalWeight) === 100
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            } mb-2`}
                    >
                        {Math.round(totalWeight) === 100 ? (
                            <BarChart className="h-5 w-5 mr-2" />
                        ) : (
                            <AlertCircle className="h-5 w-5 mr-2" />
                        )}

                        <span>
                            {Math.round(totalWeight) === 100
                                ? t("summary.weightValid")
                                : t("summary.weightInvalid", { total: Math.round(totalWeight) })}
                        </span>
                    </div>
                </motion.div>

                {/* Domain Weights */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6"
                >
                    <h3 className="text-xl font-medium mb-4">
                        {t("summary.domainWeights")}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {criteria.domainWeights
                            .sort((a, b) => b.weight - a.weight) // Sort by weight descending
                            .map((domainWeight) => (
                                <div
                                    key={domainWeight.domainId}
                                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">
                                            {getDomainName(domainWeight.domainId)}
                                        </h4>
                                        <span className="font-bold text-lg">
                                            {domainWeight.weight}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${domainWeight.weight}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </motion.div>

                {/* Maturity/Compliance Levels */}
                {criteria.type !== "percentage" && criteria.levels && criteria.levels.length > 0 && (
                    <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6"
                    >
                        <h3 className="text-xl font-medium mb-4">
                            {t(`summary.${criteria.type}Levels`)}
                        </h3>

                        <div className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
                            {criteria.levels
                                .sort((a, b) => a.value - b.value) // Ascending order for maturity
                                .map((level, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                    >
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center ${isRtl ? "ml-3" : "mr-3"} ${criteria.type === "maturity"
                                                ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                                                : "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{level.label[locale === "ar" ? "ar" : "en"]}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {level.description[locale === "ar" ? "ar" : "en"]}
                                            </p>
                                        </div>
                                        <div className={isRtl ? "text-left" : "text-right"}>
                                            <span className="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-medium">
                                                {level.value}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteModalOpen} onOpenChange={onDeleteModalOpenChange}>
                <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("summary.deleteConfirm.title")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("summary.deleteConfirm.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            {t("summary.deleteConfirm.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    {t("summary.deleteConfirm.deleting")}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <AlertCircle className="h-4 w-4" />
                                    </motion.div>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    {t("summary.deleteConfirm.confirm")}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 