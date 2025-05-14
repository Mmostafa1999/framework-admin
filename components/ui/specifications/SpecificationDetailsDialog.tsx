"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Specification, CapabilityLevel } from "@/hooks/useSpecifications";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// UI Components
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecificationDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    specification: Specification | null;
}

// Get level color based on capability level
const getLevelColor = (level: CapabilityLevel): string => {
    switch (level) {
        case "foundational": return "bg-blue-100 text-blue-800";
        case "advanced": return "bg-green-100 text-green-800";
        case "veryAdvanced": return "bg-orange-100 text-orange-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

// Get localized level name
const getLocalizedLevelName = (level: CapabilityLevel, isRtl: boolean): string => {
    switch (level) {
        case "foundational": return isRtl ? "اساسيه" : "Foundational";
        case "advanced": return isRtl ? "متقدمه" : "Advanced";
        case "veryAdvanced": return isRtl ? "متقدمه جدا" : "Very Advanced";
        default: return isRtl ? "اساسيه" : "Foundational";
    }
};

export function SpecificationDetailsDialog({
    open,
    onOpenChange,
    specification
}: SpecificationDetailsDialogProps) {
    const t = useTranslations("SpecificationDetails");
    const levelT = useTranslations("SpecificationManagement");
    const locale = useLocale();
    const isRtl = locale === "ar";

    if (!specification) return null;

    // Format date based on locale
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, "PPP", { locale: isRtl ? ar : enUS });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-[95vw] sm:max-w-[85vw] md:max-w-3xl max-h-[90vh] p-0 overflow-hidden"
                dir={isRtl ? "rtl" : "ltr"}
            >
                <DialogHeader className="bg-gradient-to-r from-blue-600 to-green-600 px-4 sm:px-6 py-3 sm:py-4 text-white">
                    <div className="flex flex-col items-center text-center">
                        <Badge className="bg-white/20 text-white border-none mb-1 sm:mb-2">
                            {specification.number}
                        </Badge>
                        <DialogTitle className="text-lg sm:text-xl font-bold break-words">
                            {specification.name[isRtl ? 'ar' : 'en']}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <ScrollArea className="p-4 sm:p-6 max-h-[calc(80vh-8rem)]" dir={isRtl ? "rtl" : "ltr"}>
                    {/* Level Badge */}
                    <div className="mb-4 flex justify-center">
                        <Badge className={`${getLevelColor(specification.capabilityLevel)} text-xs sm:text-sm`}>
                            {getLocalizedLevelName(specification.capabilityLevel, isRtl)}
                        </Badge>
                    </div>

                    {/* Description */}
                    <div className="mb-4 sm:mb-6">
                        <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base">
                            {specification.description?.[isRtl ? 'ar' : 'en']}
                        </p>
                    </div>

                    {/* Dependency */}
                    {(specification.dependency?.en || specification.dependency?.ar) && (
                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">{t("dependency")}</h3>
                            <p className="text-gray-700 text-sm sm:text-base">
                                {specification.dependency[isRtl ? 'ar' : 'en']}
                            </p>
                        </div>
                    )}

                    {/* Sub-Specifications */}
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">{t("subSpecifications")}</h3>
                        {specification.subSpecifications?.length ? (
                            <div className="space-y-3 sm:space-y-4">
                                {specification.subSpecifications.map((subSpec, index) => (
                                    <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-md border">
                                        <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">{subSpec.name[isRtl ? 'ar' : 'en']}</h4>
                                        {subSpec.description && (
                                            <p className="text-gray-600 text-xs sm:text-sm">{subSpec.description[isRtl ? 'ar' : 'en']}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-sm">{t("noSubSpecifications")}</p>
                        )}
                    </div>

                    {/* Version History */}
                    <div>
                        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">{t("versionHistory")}</h3>
                        {specification.versionHistory?.length ? (
                            <div className="space-y-2 sm:space-y-3">
                                {specification.versionHistory.map((version, index) => (
                                    <div key={index} className={`flex items-start ${isRtl ? '' : 'flex-row text-left'}`}>
                                        <div className={`bg-blue-100 text-blue-800 px-2 py-1 rounded-md ${isRtl ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'} font-medium text-xs sm:text-sm`}>
                                            {version.version}
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">{formatDate(version.date.toString())}</div>
                                            {version.note && (
                                                <p className="text-gray-700 text-sm sm:text-base">{version.note[isRtl ? 'ar' : 'en']}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-sm">{t("noVersionHistory")}</p>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className={`p-3 sm:p-4 border-t ${isRtl ? 'flex-row-reverse justify-end' : 'justify-end'}`}>
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)]"
                    >
                        {t("close")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}