import React from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoCriteriaProps {
    onCreateCriteria: () => void;
}

export const NoCriteria: React.FC<NoCriteriaProps> = ({ onCreateCriteria }) => {
    const t = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const isRtl = locale === "ar";

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
            },
        },
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center justify-center text-center py-12 px-4"
        >
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full mb-6">
                <ClipboardList className="h-12 w-12 text-gray-400 dark:text-gray-300" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t("noCriteria.title")}
            </h2>

            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                {t("noCriteria.description")}
            </p>

            <Button
                onClick={onCreateCriteria}
                className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white flex items-center gap-2 transition-colors duration-300"
            >
                <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span>{t("noCriteria.createButton")}</span>
            </Button>
        </motion.div>
    );
}; 