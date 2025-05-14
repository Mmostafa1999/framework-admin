import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
    Plus,
    Trash2,
    AlertCircle,
    ChevronUp,
    ChevronDown,
    ArrowRightToLine,
    ArrowLeftToLine
} from "lucide-react";
import { CriteriaLevel } from "@/types/assessment-criteria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CriteriaLevelConfigProps {
    criteriaType: "maturity" | "compliance";
    levels: CriteriaLevel[];
    onChange: (levels: CriteriaLevel[]) => void;
    error?: string;
}

export const CriteriaLevelConfig: React.FC<CriteriaLevelConfigProps> = ({
    criteriaType,
    levels,
    onChange,
    error,
}) => {
    const t = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const isRtl = locale === "ar";

    const [newLevel, setNewLevel] = useState<CriteriaLevel>({
        label: { en: "", ar: "" },
        description: { en: "", ar: "" },
        value: 0,
    });

    // Add a new level to the list
    const handleAddLevel = () => {
        // Validate the new level has required fields
        if (
            !newLevel.label.en ||
            !newLevel.label.ar ||
            !newLevel.description.en ||
            !newLevel.description.ar
        ) {
            return;
        }

        const updatedLevels = [...levels, { ...newLevel }];

        // Sort levels by value if it's a maturity type
        if (criteriaType === "maturity") {
            updatedLevels.sort((a, b) => a.value - b.value);
        }

        onChange(updatedLevels);

        // Reset the new level form
        setNewLevel({
            label: { en: "", ar: "" },
            description: { en: "", ar: "" },
            value: 0,
        });
    };

    // Remove a level from the list
    const handleRemoveLevel = (index: number) => {
        const updatedLevels = [...levels];
        updatedLevels.splice(index, 1);
        onChange(updatedLevels);
    };

    // Move a level up in the list
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const updatedLevels = [...levels];
        [updatedLevels[index - 1], updatedLevels[index]] = [
            updatedLevels[index],
            updatedLevels[index - 1],
        ];
        onChange(updatedLevels);
    };

    // Move a level down in the list
    const handleMoveDown = (index: number) => {
        if (index === levels.length - 1) return;
        const updatedLevels = [...levels];
        [updatedLevels[index], updatedLevels[index + 1]] = [
            updatedLevels[index + 1],
            updatedLevels[index],
        ];
        onChange(updatedLevels);
    };

    // Update a level's field
    const handleUpdateLevel = (index: number, field: string, value: any, language?: string) => {
        const updatedLevels = [...levels];

        if (field === "value") {
            updatedLevels[index].value = value;
        } else if (language && (field === "label" || field === "description")) {
            // Update a language-specific field (label or description)
            const localizedField = updatedLevels[index][field as "label" | "description"];
            if (localizedField && typeof localizedField === "object") {
                localizedField[language as "en" | "ar"] = value;
            }
        }

        onChange(updatedLevels);
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
                {t(`levelConfig.title.${criteriaType}`)}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-lg mx-auto">
                {t(`levelConfig.description.${criteriaType}`)}
            </p>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Existing Levels */}
            {levels.length > 0 && (
                <motion.div
                    className="mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-4">
                            {t("levelConfig.currentLevels")}
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th className="p-2 text-start">{t("levelConfig.table.actions")}</th>
                                        <th className="p-2 text-start">{t("levelConfig.table.level")}</th>
                                        <th className="p-2 text-start">{t("levelConfig.table.nameEn")}</th>
                                        <th className="p-2 text-start">{t("levelConfig.table.nameAr")}</th>
                                        <th className="p-2 text-start">{t("levelConfig.table.descriptionEn")}</th>
                                        <th className="p-2 text-start">{t("levelConfig.table.descriptionAr")}</th>
                                        <th className="p-2 text-start">{t("levelConfig.table.value")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {levels.map((level, index) => (
                                        <motion.tr
                                            key={index}
                                            className="border-t border-gray-200 dark:border-gray-700"
                                            variants={itemVariants}
                                        >
                                            <td className="p-2 whitespace-nowrap">
                                                <div className="flex space-x-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className="h-8 w-8"
                                                        title={t("levelConfig.actions.moveUp")}
                                                    >
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === levels.length - 1}
                                                        className="h-8 w-8"
                                                        title={t("levelConfig.actions.moveDown")}
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveLevel(index)}
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                        title={t("levelConfig.actions.remove")}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="p-2">{index + 1}</td>
                                            <td className="p-2">
                                                <Input
                                                    value={level.label.en}
                                                    onChange={(e) =>
                                                        handleUpdateLevel(index, "label", e.target.value, "en")
                                                    }
                                                    className="w-full max-w-[150px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={level.label.ar}
                                                    onChange={(e) =>
                                                        handleUpdateLevel(index, "label", e.target.value, "ar")
                                                    }
                                                    className="w-full max-w-[150px] text-right"
                                                    dir="rtl"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={level.description.en}
                                                    onChange={(e) =>
                                                        handleUpdateLevel(
                                                            index,
                                                            "description",
                                                            e.target.value,
                                                            "en"
                                                        )
                                                    }
                                                    className="w-full max-w-[200px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={level.description.ar}
                                                    onChange={(e) =>
                                                        handleUpdateLevel(
                                                            index,
                                                            "description",
                                                            e.target.value,
                                                            "ar"
                                                        )
                                                    }
                                                    className="w-full max-w-[200px] text-right"
                                                    dir="rtl"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-2 w-[180px]">
                                                    <Slider
                                                        value={[level.value]}
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        onValueChange={(values) =>
                                                            handleUpdateLevel(index, "value", values[0])
                                                        }
                                                    />
                                                    <span className="w-10 text-center">{level.value}%</span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Add New Level Form */}
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-4">
                    {t("levelConfig.addNew")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="label-en">{t("levelConfig.form.labelEn")}</Label>
                                <Input
                                    id="label-en"
                                    value={newLevel.label.en}
                                    onChange={(e) =>
                                        setNewLevel({
                                            ...newLevel,
                                            label: { ...newLevel.label, en: e.target.value },
                                        })
                                    }
                                    placeholder={t("levelConfig.form.labelEnPlaceholder")}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description-en">
                                    {t("levelConfig.form.descriptionEn")}
                                </Label>
                                <Input
                                    id="description-en"
                                    value={newLevel.description.en}
                                    onChange={(e) =>
                                        setNewLevel({
                                            ...newLevel,
                                            description: { ...newLevel.description, en: e.target.value },
                                        })
                                    }
                                    placeholder={t("levelConfig.form.descriptionEnPlaceholder")}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div>

                        <div className="space-y-4">
                            <div>
                                <Label
                                    htmlFor="label-ar"
                                    className="block text-right"
                                >
                                    {t("levelConfig.form.labelAr")}
                                </Label>
                                <Input
                                    id="label-ar"
                                    value={newLevel.label.ar}
                                    onChange={(e) =>
                                        setNewLevel({
                                            ...newLevel,
                                            label: { ...newLevel.label, ar: e.target.value },
                                        })
                                    }
                                    placeholder={t("levelConfig.form.labelArPlaceholder")}
                                    className="mt-1 text-right"
                                    dir="rtl"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="description-ar"
                                    className="block text-right"
                                >
                                    {t("levelConfig.form.descriptionAr")}
                                </Label>
                                <Input
                                    id="description-ar"
                                    value={newLevel.description.ar}
                                    onChange={(e) =>
                                        setNewLevel({
                                            ...newLevel,
                                            description: { ...newLevel.description, ar: e.target.value },
                                        })
                                    }
                                    placeholder={t("levelConfig.form.descriptionArPlaceholder")}
                                    className="mt-1 text-right"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <Label htmlFor="value">{t("levelConfig.form.value")}</Label>
                    <div className="flex items-center gap-4 mt-2">
                        <Slider
                            id="value"
                            value={[newLevel.value]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(values) =>
                                setNewLevel({ ...newLevel, value: values[0] })
                            }
                            className="flex-1"
                        />
                        <span className="w-12 text-center font-medium">{newLevel.value}%</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={handleAddLevel}
                        disabled={
                            !newLevel.label.en ||
                            !newLevel.label.ar ||
                            !newLevel.description.en ||
                            !newLevel.description.ar
                        }
                        className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white"
                    >
                        <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {t("levelConfig.actions.add")}
                    </Button>
                </div>
            </div>
        </div>
    );
}; 