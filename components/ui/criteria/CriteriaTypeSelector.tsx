import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { CriteriaType } from "@/types/assessment-criteria";
import { Check, Percent, BarChart, FileCheck } from "lucide-react";

interface CriteriaTypeSelectorProps {
    selectedType: CriteriaType;
    onTypeSelect: (type: CriteriaType) => void;
}

export const CriteriaTypeSelector: React.FC<CriteriaTypeSelectorProps> = ({
    selectedType,
    onTypeSelect,
}) => {
    const t = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const isRtl = locale === "ar";

    const types: { type: CriteriaType; icon: React.ReactNode; gradientFrom: string; gradientTo: string }[] = [
        {
            type: "percentage",
            icon: <Percent className="h-8 w-8 mb-2" />,
            gradientFrom: "from-blue-500",
            gradientTo: "to-blue-600",
        },
        {
            type: "maturity",
            icon: <BarChart className="h-8 w-8 mb-2" />,
            gradientFrom: "from-green-500",
            gradientTo: "to-green-600",
        },
        {
            type: "compliance",
            icon: <FileCheck className="h-8 w-8 mb-2" />,
            gradientFrom: "from-purple-500",
            gradientTo: "to-purple-600",
        },
    ];

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
        <div className="px-1 pb-4">
            <h2 className="text-2xl font-semibold mb-6 text-center">
                {t("typeSelector.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-lg mx-auto">
                {t("typeSelector.description")}
            </p>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {types.map(({ type, icon, gradientFrom, gradientTo }) => (
                    <motion.div key={type} variants={itemVariants}>
                        <Card
                            className={`cursor-pointer transition-all duration-300 transform hover:scale-105 h-full ${selectedType === type
                                    ? "ring-2 ring-[var(--primary-blue)] shadow-lg"
                                    : "hover:shadow-md"
                                }`}
                            onClick={() => onTypeSelect(type)}
                        >
                            <CardContent className="p-6 flex flex-col items-center h-full">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white mb-4`}>
                                    {icon}
                                </div>

                                <h3 className="text-lg font-medium mb-2">
                                    {t(`typeSelector.types.${type}.title`)}
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                                    {t(`typeSelector.types.${type}.description`)}
                                </p>

                                {selectedType === type && (
                                    <div className="mt-auto">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--primary-blue)] text-white">
                                            <Check className="h-4 w-4 mr-1" />
                                            {t("typeSelector.selected")}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}; 