import React from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { CheckCircle2, AlertCircle, BatteryFull, Percent, FileCheck } from "lucide-react";
import { Domain } from "@/types/assessment-criteria";
import { CriteriaFormState } from "@/hooks/useCriteriaBuilder";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CriteriaPreviewProps {
    formState: CriteriaFormState;
    domains: Domain[];
    error?: string;
}

export const CriteriaPreview: React.FC<CriteriaPreviewProps> = ({
    formState,
    domains,
    error,
}) => {
    const t = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const isRtl = locale === "ar";

    const totalWeight = formState.domainWeights.reduce(
        (sum, domain) => sum + domain.weight,
        0
    );

    // Get domain name based on domain ID
    const getDomainName = (domainId: string): string => {
        const domain = domains.find((d) => d.id === domainId);
        return domain ? domain.name[locale === "ar" ? "ar" : "en"] : domainId;
    };

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
        <div className="px-1 py-4">
            <h2 className="text-2xl font-semibold mb-6 text-center">
                {t("preview.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-lg mx-auto">
                {t("preview.description")}
            </p>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <motion.div
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Summary Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6"
                >
                    <h3 className="text-xl font-medium mb-4">{t("preview.summary")}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                            {formState.type === "percentage" ? (
                                <Percent className="h-6 w-6 text-blue-500 mr-3" />
                            ) : formState.type === "maturity" ? (
                                <BatteryFull className="h-6 w-6 text-green-500 mr-3" />
                            ) : (
                                <FileCheck className="h-6 w-6 text-purple-500 mr-3" />
                            )}
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t("preview.criteriaType")}
                                </p>
                                <p className="font-medium">
                                    {t(`typeSelector.types.${formState.type}.title`)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                                {domains.length}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t("preview.domains")}
                                </p>
                                <p className="font-medium">
                                    {t("preview.domainsCount", { count: domains.length })}
                                </p>
                            </div>
                        </div>

                        {formState.type !== "percentage" && (
                            <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-500">
                                    {formState.levels.length}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {t("preview.levels")}
                                    </p>
                                    <p className="font-medium">
                                        {t("preview.levelsCount", { count: formState.levels.length })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Weight Distribution Check */}
                    <div
                        className={`flex items-center p-4 rounded-lg ${Math.round(totalWeight) === 100
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            } mb-4`}
                    >
                        {Math.round(totalWeight) === 100 ? (
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                        ) : (
                            <AlertCircle className="h-5 w-5 mr-2" />
                        )}

                        <span>
                            {Math.round(totalWeight) === 100
                                ? t("preview.weightValid")
                                : t("preview.weightInvalid", { total: Math.round(totalWeight) })}
                        </span>
                    </div>
                </motion.div>

                {/* Domain Weights */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6"
                >
                    <h3 className="text-xl font-medium mb-4">{t("preview.domainWeights")}</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700">
                                    <th className="p-3 text-left">{t("preview.table.domain")}</th>
                                    <th className="p-3 text-left">{t("preview.table.weight")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formState.domainWeights
                                    .sort((a, b) => b.weight - a.weight) // Sort by weight descending
                                    .map((domainWeight) => (
                                        <tr
                                            key={domainWeight.domainId}
                                            className="border-t border-gray-100 dark:border-gray-700"
                                        >
                                            <td className="p-3">{getDomainName(domainWeight.domainId)}</td>
                                            <td className="p-3">
                                                <div className="flex items-center">
                                                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                                                        <div
                                                            className="bg-blue-500 h-2 rounded-full"
                                                            style={{ width: `${domainWeight.weight}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{domainWeight.weight}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                <tr className="border-t border-gray-300 dark:border-gray-600 font-medium">
                                    <td className="p-3">{t("preview.table.total")}</td>
                                    <td className="p-3">
                                        <span className={Math.round(totalWeight) !== 100 ? "text-red-500" : ""}>
                                            {Math.round(totalWeight)}%
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Maturity/Compliance Levels */}
                {formState.type !== "percentage" && formState.levels.length > 0 && (
                    <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6"
                    >
                        <h3 className="text-xl font-medium mb-4">
                            {t(`preview.${formState.type}Levels`)}
                        </h3>

                        <div className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
                            {formState.levels
                                .sort((a, b) => a.value - b.value) // Ascending order for maturity
                                .map((level, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                    >
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center ${isRtl ? "ml-3" : "mr-3"} ${formState.type === "maturity"
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
        </div>
    );
}; 