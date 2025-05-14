"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Pencil, Trash2, Info, ListTree, Tag, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Control } from "@/hooks/useControls";
import { useLanguageFallback } from "@/lib/useLanguageFallback";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ControlCardProps {
    control: Control;
    onEdit: (control: Control) => void;
    onDelete: (controlId: string) => void;
    onViewDetails?: (controlId: string) => void;
    index?: number;
    frameworkId?: string;
    domainId?: string;
}

// Card hover animation
const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

// Map dimension to color
const dimensionColors = {
    plan: "from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500",
    implement: "from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500",
    operate: "from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500"
};

// Map dimension to badge color
const dimensionBadgeColors = {
    plan: "bg-indigo-700 hover:bg-indigo-600",
    implement: "bg-blue-700 hover:bg-blue-600",
    operate: "bg-teal-700 hover:bg-teal-600"
};

// Map dimension to human-readable name
const dimensionNames = {
    plan: {
        en: "Plan",
        ar: "تخطيط"
    },
    implement: {
        en: "Implement",
        ar: "تنفيذ"
    },
    operate: {
        en: "Operate",
        ar: "تشغيل"
    }
};

export function ControlCard({ control, onEdit, onDelete, onViewDetails, frameworkId, domainId, index = 0 }: ControlCardProps) {
    const t = useTranslations("ControlsManagement");
    const commonT = useTranslations("Common");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const [showDetails, setShowDetails] = useState(false);
    const [preventNavigation, setPreventNavigation] = useState(false);

    // Get dimension color and name
    const dimensionColor = dimensionColors[control.dimension] || dimensionColors.implement;
    const dimensionBadgeColor = dimensionBadgeColors[control.dimension] || dimensionBadgeColors.implement;
    const dimensionName = dimensionNames[control.dimension]?.[locale as "en" | "ar"] || dimensionNames.implement.en;

    // Handle language fallback for control name and description
    const name = control.name[locale as "en" | "ar"] || control.name["en"];
    const description = control.description[locale as "en" | "ar"] || control.description["en"];

    // Function to handle card click to navigate to control's detail page
    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        // Don't navigate if we're showing/hiding the details dialog
        if (preventNavigation) {
            setPreventNavigation(false);
            return;
        }

        // Navigate to control's detail page
        if (onViewDetails) {
            onViewDetails(control.controlId);
        }
    };

    // Function to handle dialog open/close while preventing navigation
    const handleDialogOpenChange = (open: boolean) => {
        setShowDetails(open);
        setPreventNavigation(true);
        // Reset the prevention after navigation would have occurred
        setTimeout(() => {
            setPreventNavigation(false);
        }, 100);
    };

    // Get background gradient for dialog based on dimension
    const getDialogGradient = () => {
        switch (control.dimension) {
            case 'plan':
                return 'from-indigo-600/95 to-blue-600/95';
            case 'implement':
                return 'from-blue-600/95 to-cyan-600/95';
            case 'operate':
                return 'from-cyan-600/95 to-teal-600/95';
            default:
                return 'from-blue-600/95 to-cyan-600/95';
        }
    };

    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            variants={cardHover}
            style={{ direction: isRtl ? "rtl" : "ltr" }}
            className="h-full cursor-pointer"
            onClick={handleCardClick}
        >
            <div className={`w-full h-[320px] p-5 rounded-xl relative overflow-hidden bg-gradient-to-r ${dimensionColor} flex flex-col`}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 bg-white transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full opacity-10 bg-white transform -translate-x-1/3 translate-y-1/3" />

                {/* Main content */}
                <div className="flex flex-col gap-3 text-white h-full">
                    {/* Title with fixed height */}
                    <div className="min-h-[40px]">
                        <h2 className="text-2xl font-bold truncate">{name}</h2>
                    </div>

                    {/* Description with fixed height */}
                    <div className="min-h-[80px] max-h-[80px] overflow-hidden">
                        <p className="text-sm opacity-80 line-clamp-3">{description || t("noDescription")}</p>
                    </div>

                    {/* Dimension Badge */}
                    <div className="min-h-[40px]">
                        <Badge className={`${dimensionBadgeColor} text-white border-0`}>
                            <Layers className={`h-3 w-3 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                            {dimensionName}
                        </Badge>
                    </div>

                    {/* Control ID */}
                    <Badge className="w-fit bg-white/20 text-white hover:bg-white/30 border-0">
                        ID: {control.controlId}
                    </Badge>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center mt-auto pt-4">
                        <motion.button
                            className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.preventDefault(); // Prevent default behavior
                                e.stopPropagation(); // Prevent card click
                                setPreventNavigation(true);
                                setShowDetails(true);
                            }}
                            aria-label={locale === 'ar' ? 'عرض التفاصيل' : 'Show details'}
                        >
                            <Info className="h-4 w-4" />
                            <span>{locale === 'ar' ? 'عرض التفاصيل' : 'Show details'}</span>
                        </motion.button>

                        <div className="flex gap-2">
                            <motion.button
                                className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    onEdit(control);
                                }}
                                aria-label={t("editControl")}
                            >
                                <Pencil className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                                className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    onDelete(control.controlId);
                                }}
                                aria-label={t("deleteControl")}
                            >
                                <Trash2 className="h-4 w-4" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Details Dialog */}
            <Dialog open={showDetails} onOpenChange={handleDialogOpenChange}>
                <DialogContent className={`sm:max-w-[500px] ${isRtl ? 'rtl' : 'ltr'} bg-gradient-to-br ${getDialogGradient()} text-white max-h-[85vh] overflow-y-auto overflow-x-hidden`}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Control Description */}
                        <div className="mb-4">
                            <p className="opacity-80">{locale === 'ar' ? 'وصف الضابط:' : 'Control Description:'}</p>
                            <p className="text-white max-h-[150px] overflow-y-auto overflow-x-hidden break-all whitespace-normal">
                                {description || t("noDescription")}
                            </p>
                        </div>

                        {/* Dimension */}
                        <div className="mb-4">
                            <p className="opacity-80 mb-2">{locale === 'ar' ? 'البعد:' : 'Dimension:'}</p>
                            <Badge className={`${dimensionBadgeColor} text-white border-0`}>
                                <Layers className={`h-3 w-3 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                                {dimensionName}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {/* Control ID */}
                            <div className="flex items-center gap-2 text-sm">
                                <div>
                                    <span className="opacity-80">ID: </span>
                                    <span className="font-medium">{control.controlId}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <motion.div
                        className="mt-5 flex justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <button
                            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPreventNavigation(true);
                                setShowDetails(false);
                            }}
                        >
                            {commonT ? commonT("cancel") : t("cancel")}
                        </button>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
} 